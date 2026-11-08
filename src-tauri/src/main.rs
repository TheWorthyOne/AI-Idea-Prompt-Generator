// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::LazyLock;
use std::time::{SystemTime, UNIX_EPOCH};

static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(reqwest::Client::new);
static GENERATION_COUNTER: AtomicUsize = AtomicUsize::new(0);

static IDEA_CATALOG: LazyLock<Vec<IdeaProfile>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../src/data/ideas.json"))
        .expect("src/data/ideas.json must be valid IdeaProfile JSON")
});

const KEYRING_SERVICE: &str = "ai-idea-prompt-generator";
const KEYRING_ACCOUNT: &str = "anthropic_api_key";
const DEFAULT_CLAUDE_MODEL: &str = "claude-sonnet-4-20250514";

#[derive(Debug, Clone, Deserialize)]
struct IdeaProfile {
    slug: String,
    category: String,
    name: String,
    scope: String,
    platform: String,
    audience: String,
    challenge: String,
    outcome: String,
    monetization: String,
    features: Vec<String>,
    suggested_stack: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct IdeaResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    slug: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    scope: Option<String>,
    concept: String,
    platform: String,
    target_audience: String,
    key_features: Vec<String>,
    monetization: String,
    value_proposition: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    suggested_stack: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicContent {
    text: String,
}

#[derive(Debug, Default)]
struct LocalGenFilter<'a> {
    category: &'a str,
    scope: Option<&'a str>,
    platform_filter: Option<&'a str>,
    focus: Option<&'a str>,
    exclude_names: &'a [String],
}

#[tauri::command]
async fn generate_idea(
    category: String,
    api_key: Option<String>,
    scope: Option<String>,
    platform_filter: Option<String>,
    focus: Option<String>,
    exclude_names: Option<Vec<String>>,
    model: Option<String>,
) -> Result<IdeaResponse, String> {
    let excluded = exclude_names.unwrap_or_default();
    match api_key.filter(|key| !key.trim().is_empty()) {
        Some(api_key) => {
            generate_idea_with_anthropic(
                &category,
                api_key,
                scope.as_deref(),
                platform_filter.as_deref(),
                focus.as_deref(),
                &excluded,
                model.as_deref(),
            )
            .await
        }
        None => generate_local_idea_with_filters(LocalGenFilter {
            category: &category,
            scope: scope.as_deref(),
            platform_filter: platform_filter.as_deref(),
            focus: focus.as_deref(),
            exclude_names: &excluded,
        }),
    }
}

fn matches_platform(profile_platform: &str, platform_filter: Option<&str>) -> bool {
    match platform_filter {
        None | Some("") | Some("Any Platform") => true,
        Some(filter) => profile_platform
            .to_lowercase()
            .contains(&filter.to_lowercase()),
    }
}

fn matches_scope(profile_scope: &str, scope_filter: Option<&str>) -> bool {
    match scope_filter {
        None | Some("") | Some("Any Scope") => true,
        Some(filter) => profile_scope.eq_ignore_ascii_case(filter),
    }
}

fn score_focus_match(profile: &IdeaProfile, focus: &str) -> usize {
    let tokens: Vec<String> = focus
        .to_lowercase()
        .split(|c: char| c.is_whitespace() || matches!(c, ',' | ';' | '/'))
        .map(str::trim)
        .filter(|t| t.len() >= 3)
        .map(String::from)
        .collect();

    if tokens.is_empty() {
        return 0;
    }

    let mut haystack = format!(
        "{} {} {} {} {} {} {} {} {}",
        profile.name,
        profile.category,
        profile.scope,
        profile.platform,
        profile.audience,
        profile.challenge,
        profile.outcome,
        profile.monetization,
        profile.suggested_stack
    )
    .to_lowercase();
    for feat in &profile.features {
        haystack.push(' ');
        haystack.push_str(&feat.to_lowercase());
    }

    tokens.iter().filter(|tok| haystack.contains(tok.as_str())).count()
}

fn generate_local_idea_with_filters(filter: LocalGenFilter<'_>) -> Result<IdeaResponse, String> {
    let category_candidates: Vec<&IdeaProfile> = IDEA_CATALOG
        .iter()
        .filter(|p| filter.category == "All Categories" || p.category == filter.category)
        .collect();

    if category_candidates.is_empty() {
        return Err(format!(
            "No built-in idea profile exists for {}.",
            filter.category
        ));
    }

    let both_matched: Vec<&IdeaProfile> = category_candidates
        .iter()
        .copied()
        .filter(|p| matches_scope(&p.scope, filter.scope) && matches_platform(&p.platform, filter.platform_filter))
        .collect();

    let narrowed = if !both_matched.is_empty() {
        both_matched
    } else {
        let scope_only: Vec<&IdeaProfile> = category_candidates
            .iter()
            .copied()
            .filter(|p| matches_scope(&p.scope, filter.scope))
            .collect();
        let platform_only: Vec<&IdeaProfile> = category_candidates
            .iter()
            .copied()
            .filter(|p| matches_platform(&p.platform, filter.platform_filter))
            .collect();
        if !scope_only.is_empty() {
            scope_only
        } else if !platform_only.is_empty() {
            platform_only
        } else {
            category_candidates
        }
    };

    let excluded_lower: HashSet<String> = filter
        .exclude_names
        .iter()
        .map(|s| s.trim().to_lowercase())
        .collect();

    let unseen: Vec<&IdeaProfile> = narrowed
        .iter()
        .copied()
        .filter(|p| {
            !excluded_lower.contains(&p.name.to_lowercase())
                && !excluded_lower.contains(&p.slug.to_lowercase())
        })
        .collect();

    let pool = if !unseen.is_empty() { unseen } else { narrowed };

    let trimmed_focus = filter.focus.map(str::trim).unwrap_or("");
    let final_pool: Vec<&IdeaProfile> = if !trimmed_focus.is_empty() {
        let mut scored: Vec<(&IdeaProfile, usize)> = pool
            .iter()
            .copied()
            .map(|p| (p, score_focus_match(p, trimmed_focus)))
            .filter(|(_, s)| *s > 0)
            .collect();
        scored.sort_by(|a, b| b.1.cmp(&a.1));
        if let Some((_, top)) = scored.first().copied() {
            scored
                .into_iter()
                .filter(|(_, s)| *s >= top)
                .map(|(p, _)| p)
                .collect()
        } else {
            pool
        }
    } else {
        pool
    };

    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let tick = GENERATION_COUNTER.fetch_add(1, Ordering::Relaxed) as u128;
    // Mix timestamp + monotonic counter via SplitMix-style hash so rapid clicks never collide
    let mixed = (nanos ^ (tick.wrapping_mul(0x9E37_79B9_7F4A_7C15)))
        .wrapping_mul(0xBF58_476D_1CE4_E5B9);

    let profile = final_pool[local_profile_index(mixed, final_pool.len())];
    let feature_len = profile.features.len().max(1);
    let feature_offset = ((mixed >> 16) as usize) % feature_len;
    let spotlight = profile.features[feature_offset].to_lowercase();
    let key_features = (0..profile.features.len())
        .map(|idx| profile.features[(feature_offset + idx) % feature_len].clone())
        .collect();

    let matched_focus = !trimmed_focus.is_empty() && score_focus_match(profile, trimmed_focus) > 0;
    let focus_tail = if !trimmed_focus.is_empty() && !matched_focus {
        format!(" Tailored specifically around \"{}\".", trimmed_focus)
    } else {
        String::new()
    };

    let target_audience = if !trimmed_focus.is_empty() && !matched_focus {
        format!("{} (with a focus on {})", profile.audience, trimmed_focus)
    } else {
        profile.audience.clone()
    };

    Ok(IdeaResponse {
        slug: Some(profile.slug.clone()),
        name: Some(profile.name.clone()),
        category: Some(profile.category.clone()),
        scope: Some(profile.scope.clone()),
        concept: format!(
            "{} is a {} product ({}) for {}, anchored by {}. It helps them {}—delivering {}.{}",
            profile.name,
            profile.platform.to_lowercase(),
            profile.scope.to_lowercase(),
            profile.audience,
            spotlight,
            profile.challenge,
            profile.outcome,
            focus_tail
        ),
        platform: profile.platform.clone(),
        target_audience,
        key_features,
        monetization: profile.monetization.clone(),
        value_proposition: format!(
            "{} gives {} {}, centered on {}.",
            profile.name, profile.audience, profile.outcome, spotlight
        ),
        suggested_stack: Some(profile.suggested_stack.clone()),
        source: Some("local".to_string()),
    })
}

fn local_profile_index(seed: u128, profile_count: usize) -> usize {
    (seed % profile_count as u128) as usize
}

async fn generate_idea_with_anthropic(
    category: &str,
    api_key: String,
    scope: Option<&str>,
    platform_filter: Option<&str>,
    focus: Option<&str>,
    exclude_names: &[String],
    model: Option<&str>,
) -> Result<IdeaResponse, String> {
    let category_filter = if category == "All Categories" {
        "any practical domain or industry".to_string()
    } else {
        format!("the {} space", category)
    };

    let scope_clause = match scope {
        None | Some("") | Some("Any Scope") => "a realistic, buildable MVP scope".to_string(),
        Some(s) => format!("a \"{}\" build scope", s),
    };

    let platform_clause = match platform_filter {
        None | Some("") | Some("Any Platform") => {
            "the best-fit platform (Web, Mobile, Desktop, or Browser Extension)".to_string()
        }
        Some(p) => format!("the {} platform", p),
    };

    let focus_clause = match focus.map(str::trim).filter(|f| !f.is_empty()) {
        Some(f) => format!("\nIncorporate this specific angle, audience, or constraint: \"{}\".", f),
        None => String::new(),
    };

    let avoid_clause = if exclude_names.is_empty() {
        String::new()
    } else {
        let recent: Vec<&str> = exclude_names.iter().take(25).map(String::as_str).collect();
        format!(
            "\nDo NOT repeat or closely imitate these existing ideas: {}.",
            recent.join(", ")
        )
    };

    let prompt = format!(
        r#"Generate an original, grounded, genuinely buildable startup or software product idea in {}, designed for {} on {}.{}{}{}

Avoid generic "AI wrapper for everything" clichés—anchor the concept in a concrete workflow, sharp target user, and clear wedge feature.

Return ONLY valid JSON matching this exact structure:
{{
  "name": "Short memorable product name (1-3 words)",
  "category": "{}",
  "scope": "{}",
  "concept": "2-3 crisp sentences explaining what it is, the painful workflow it fixes, and the outcome.",
  "platform": "Recommended platform",
  "target_audience": "Specific target persona and context",
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6"],
  "monetization": "Realistic pricing and business model",
  "value_proposition": "1 punchy sentence stating why users switch to this",
  "suggested_stack": "Concrete recommended tech stack for building v1 fast"
}}"#,
        category_filter,
        scope_clause,
        platform_clause,
        focus_clause,
        avoid_clause,
        "",
        if category == "All Categories" {
            "Best matching category name"
        } else {
            category
        },
        match scope {
            None | Some("") | Some("Any Scope") => {
                "Weekend MVP | Solo SaaS | Tool / Extension | Full Product"
            }
            Some(s) => s,
        }
    );

    let selected_model = model
        .map(str::trim)
        .filter(|m| !m.is_empty())
        .unwrap_or(DEFAULT_CLAUDE_MODEL)
        .to_string();

    let api_request = AnthropicRequest {
        model: selected_model,
        max_tokens: 2048,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: prompt,
        }],
    };

    let response = HTTP_CLIENT
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key.trim())
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&api_request)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_text));
    }

    let api_response: AnthropicResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let response_text = api_response
        .content
        .first()
        .ok_or("No content in response")?
        .text
        .clone();

    let json_text = if response_text.contains("```json") {
        response_text
            .split("```json")
            .nth(1)
            .and_then(|s| s.split("```").next())
            .unwrap_or(&response_text)
            .trim()
    } else if response_text.contains("```") {
        response_text
            .split("```")
            .nth(1)
            .and_then(|s| s.split("```").next())
            .unwrap_or(&response_text)
            .trim()
    } else {
        response_text.trim()
    };

    let mut idea: IdeaResponse = serde_json::from_str(json_text)
        .map_err(|e| format!("Failed to parse idea JSON: {}. Response: {}", e, json_text))?;
    idea.source = Some("ai".to_string());

    Ok(idea)
}

#[tauri::command]
async fn test_api_key(api_key: String, model: Option<String>) -> Result<bool, String> {
    let selected_model = model
        .as_deref()
        .map(str::trim)
        .filter(|m| !m.is_empty())
        .unwrap_or(DEFAULT_CLAUDE_MODEL)
        .to_string();

    let test_request = AnthropicRequest {
        model: selected_model,
        max_tokens: 10,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: "Hi".to_string(),
        }],
    };

    let response = HTTP_CLIENT
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key.trim())
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&test_request)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    Ok(response.status().is_success())
}

fn api_key_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_api_key() -> Result<Option<String>, String> {
    let entry = api_key_entry()?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
async fn set_api_key(api_key: String) -> Result<(), String> {
    let api_key = api_key.trim().to_string();
    if api_key.is_empty() {
        return delete_api_key().await;
    }

    let entry = api_key_entry()?;
    entry.set_password(&api_key).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_api_key() -> Result<(), String> {
    let entry = api_key_entry()?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            generate_idea,
            test_api_key,
            get_api_key,
            set_api_key,
            delete_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{
        generate_local_idea_with_filters, local_profile_index, LocalGenFilter, IDEA_CATALOG,
    };
    use std::collections::HashSet;

    #[test]
    fn shared_catalog_contains_ninety_curated_ideas_across_fifteen_categories() {
        assert_eq!(IDEA_CATALOG.len(), 90);
        let categories: HashSet<&str> = IDEA_CATALOG.iter().map(|p| p.category.as_str()).collect();
        assert_eq!(categories.len(), 15);
    }

    #[test]
    fn generates_distinct_ideas_within_same_category_when_excluding_seen() {
        let mut seen: Vec<String> = Vec::new();
        for _ in 0..6 {
            let idea = generate_local_idea_with_filters(LocalGenFilter {
                category: "Fintech",
                exclude_names: &seen,
                ..Default::default()
            })
            .expect("Fintech ideas exist");

            let name = idea.name.expect("name populated");
            assert!(!seen.contains(&name), "Did not expect duplicate {name}");
            seen.push(name);
        }
        assert_eq!(seen.len(), 6);
    }

    #[test]
    fn filters_by_scope_and_platform() {
        let idea = generate_local_idea_with_filters(LocalGenFilter {
            category: "All Categories",
            scope: Some("Tool / Extension"),
            platform_filter: Some("Browser Extension"),
            ..Default::default()
        })
        .expect("Browser extension tool exists");

        assert_eq!(idea.scope.as_deref(), Some("Tool / Extension"));
        assert!(idea.platform.to_lowercase().contains("extension"));
    }

    #[test]
    fn index_covers_every_slot() {
        let selected = (0..15_u128)
            .map(|tick| local_profile_index(tick, 15))
            .collect::<HashSet<_>>();
        assert_eq!(selected.len(), 15);
    }

    #[test]
    fn unknown_category_returns_an_error() {
        let result = generate_local_idea_with_filters(LocalGenFilter {
            category: "Unknown",
            ..Default::default()
        });
        assert!(result.is_err());
    }
}
