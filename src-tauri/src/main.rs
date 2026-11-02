// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use std::time::{SystemTime, UNIX_EPOCH};

static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(reqwest::Client::new);

#[derive(Debug, Serialize, Deserialize)]
struct IdeaResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    concept: String,
    platform: String,
    target_audience: String,
    key_features: Vec<String>,
    monetization: String,
    value_proposition: String,
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

#[derive(Clone, Copy)]
struct IdeaProfile {
    category: &'static str,
    name: &'static str,
    audience: &'static str,
    challenge: &'static str,
    outcome: &'static str,
    platform: &'static str,
    monetization: &'static str,
    features: [&'static str; 5],
}

const IDEA_PROFILES: [IdeaProfile; 15] = [
    IdeaProfile {
        category: "Fintech",
        name: "Rill",
        audience: "independent workers with uneven income",
        challenge: "plan around unpredictable paydays and scattered bills",
        outcome: "a calmer view of what is safe to spend and save",
        platform: "Mobile",
        monetization: "A free personal plan with a paid tier for tax estimates and shared household budgets.",
        features: ["Income-aware spending limits", "Upcoming bill timeline", "Tax set-aside suggestions", "Low-balance forecasts", "Monthly cash-flow recap"],
    },
    IdeaProfile {
        category: "Healthcare",
        name: "Carepath",
        audience: "people coordinating ongoing care for a family member",
        challenge: "keep appointments, care notes, and family updates in sync",
        outcome: "one dependable handoff between everyone involved in care",
        platform: "Mobile and Web",
        monetization: "A free care circle with an optional family plan for expanded storage and reminders.",
        features: ["Shared care calendar", "Visit note templates", "Medication reminders", "Family task handoffs", "Exportable care summary"],
    },
    IdeaProfile {
        category: "E-commerce",
        name: "Second Shelf",
        audience: "small online shops with limited inventory",
        challenge: "decide what to restock before cash is tied up in slow sellers",
        outcome: "smarter small-batch buying based on real customer interest",
        platform: "Web",
        monetization: "A monthly subscription scaled by active products and connected sales channels.",
        features: ["Low-stock watchlist", "Waitlist demand signals", "Small-batch order planner", "Product interest tracking", "Supplier lead-time notes"],
    },
    IdeaProfile {
        category: "Education",
        name: "Recall Room",
        audience: "students preparing for cumulative exams",
        challenge: "turn class notes into a realistic, spaced study routine",
        outcome: "short practice sessions that focus on what is not sticking yet",
        platform: "Web and Mobile",
        monetization: "A free student plan with a paid version for course packs and study groups.",
        features: ["Notes-to-question cards", "Confidence-based review queue", "Study session planner", "Topic progress map", "Shared class decks"],
    },
    IdeaProfile {
        category: "SaaS",
        name: "Tandem Notes",
        audience: "small service teams juggling client conversations",
        challenge: "remember decisions and follow-ups across scattered meetings",
        outcome: "a lightweight record of what was decided and who owns the next step",
        platform: "Web",
        monetization: "A per-seat subscription with a free plan for small teams.",
        features: ["Client decision log", "Follow-up owner tracking", "Meeting note templates", "Searchable project timeline", "Weekly open-loop digest"],
    },
    IdeaProfile {
        category: "Entertainment",
        name: "SceneScout",
        audience: "friends trying to choose something to watch together",
        challenge: "find a good pick everyone can actually access",
        outcome: "fewer searches and more shared watch nights",
        platform: "Mobile and Web",
        monetization: "A free discovery app with optional premium watchlists and partner referrals.",
        features: ["Shared mood board", "Streaming availability filters", "Group voting", "Spoiler-safe recommendations", "Watch-night queue"],
    },
    IdeaProfile {
        category: "Social Media",
        name: "Small Circle",
        audience: "neighbors and local groups who want useful updates",
        challenge: "find trustworthy local information without a noisy public feed",
        outcome: "a more useful, close-knit place to share what is happening nearby",
        platform: "Mobile",
        monetization: "Optional paid group tools for local organizers and community spaces.",
        features: ["Invite-only neighborhood groups", "Local request board", "Event coordination", "Helpful update digest", "Community resource map"],
    },
    IdeaProfile {
        category: "Productivity",
        name: "One Clear Thing",
        audience: "people whose task lists grow faster than their available time",
        challenge: "choose a meaningful next task when everything feels urgent",
        outcome: "a realistic daily plan with room for interruptions",
        platform: "Desktop and Mobile",
        monetization: "A free personal planner with paid cross-device sync and team spaces.",
        features: ["Daily capacity planner", "Task time estimates", "Focus session timer", "Carryover review", "Calendar-aware suggestions"],
    },
    IdeaProfile {
        category: "Gaming",
        name: "Party Finder",
        audience: "players looking for teammates with a compatible play style",
        challenge: "find a good group without awkward matchmaking",
        outcome: "more welcoming sessions built around shared goals and availability",
        platform: "Web and Mobile",
        monetization: "Free matching with optional community and tournament tools.",
        features: ["Play-style profiles", "Availability matching", "Beginner-friendly tags", "Session scheduling", "Post-game group notes"],
    },
    IdeaProfile {
        category: "Travel",
        name: "Layover Local",
        audience: "travelers with a few free hours between connections",
        challenge: "plan a low-stress outing that fits the time and airport distance",
        outcome: "a useful mini-adventure with a safe return buffer",
        platform: "Mobile",
        monetization: "Free itineraries with optional booking referrals and offline city packs.",
        features: ["Time-aware outing plans", "Transit time estimates", "Return-to-gate buffer", "Luggage-friendly places", "Offline itinerary"],
    },
    IdeaProfile {
        category: "Food & Beverage",
        name: "Pantry Loop",
        audience: "households trying to waste less food during busy weeks",
        challenge: "remember what is at home and use it before it goes bad",
        outcome: "simple meals shaped around ingredients already on hand",
        platform: "Mobile",
        monetization: "A free pantry tool with a paid meal-planning and household sharing tier.",
        features: ["Quick pantry capture", "Use-soon reminders", "Leftover meal ideas", "Shared shopping list", "Weekly waste recap"],
    },
    IdeaProfile {
        category: "Real Estate",
        name: "Open House Notes",
        audience: "first-time home buyers comparing several properties",
        challenge: "remember how each place felt after a packed day of viewings",
        outcome: "clear, side-by-side comparisons grounded in personal priorities",
        platform: "Mobile",
        monetization: "A free buyer notebook with optional paid sharing for households and advisors.",
        features: ["Room-by-room notes", "Photo annotations", "Priority scorecards", "Offer question checklist", "Household comparison view"],
    },
    IdeaProfile {
        category: "Transportation",
        name: "Parkside",
        audience: "commuters who combine driving with public transit",
        challenge: "find a reliable parking and transit combination for the day",
        outcome: "a less stressful door-to-door commute plan",
        platform: "Mobile",
        monetization: "A free commuter planner with optional employer and parking-provider integrations.",
        features: ["Park-and-ride options", "Departure time comparison", "Parking availability notes", "Transit disruption alerts", "Saved commute plans"],
    },
    IdeaProfile {
        category: "Environment",
        name: "Repair Map",
        audience: "people who want to fix everyday items instead of replacing them",
        challenge: "find a nearby repair option and understand what to bring",
        outcome: "more useful things repaired, with less guesswork",
        platform: "Web and Mobile",
        monetization: "Free local listings with optional tools for repair shops and community groups.",
        features: ["Searchable repair directory", "Item-specific prep guides", "Repair event calendar", "Community repair notes", "Reuse impact log"],
    },
    IdeaProfile {
        category: "AI & Machine Learning",
        name: "Model Ledger",
        audience: "small teams experimenting with multiple AI tools",
        challenge: "understand which model works best for a recurring task",
        outcome: "a practical record of quality, speed, and cost for each workflow",
        platform: "Web",
        monetization: "A free evaluation workspace with paid team history and reporting.",
        features: ["Prompt version history", "Side-by-side result review", "Latency and cost tracking", "Reusable evaluation sets", "Team decision notes"],
    },
];

#[tauri::command]
async fn generate_idea(category: String, api_key: Option<String>) -> Result<IdeaResponse, String> {
    match api_key.filter(|key| !key.trim().is_empty()) {
        Some(api_key) => generate_idea_with_anthropic(&category, api_key).await,
        None => generate_local_idea(&category),
    }
}

fn generate_local_idea(category: &str) -> Result<IdeaResponse, String> {
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64;
    let profiles: Vec<IdeaProfile> = if category == "All Categories" {
        IDEA_PROFILES.to_vec()
    } else {
        IDEA_PROFILES
            .iter()
            .copied()
            .filter(|profile| profile.category == category)
            .collect()
    };

    if profiles.is_empty() {
        return Err(format!("No built-in idea profile exists for {category}."));
    }

    let profile = profiles[(seed as usize) % profiles.len()];
    let feature_offset = ((seed >> 8) as usize) % profile.features.len();
    let spotlight = profile.features[feature_offset].to_lowercase();
    let key_features = (0..profile.features.len())
        .map(|index| profile.features[(feature_offset + index) % profile.features.len()].to_string())
        .collect();

    Ok(IdeaResponse {
        category: Some(profile.category.to_string()),
        concept: format!(
            "{} is a {} tool for {}, built around {}. It helps them {}, so they can reach {}.",
            profile.name,
            profile.platform.to_lowercase(),
            profile.audience,
            spotlight,
            profile.challenge,
            profile.outcome
        ),
        platform: profile.platform.to_string(),
        target_audience: profile.audience.to_string(),
        key_features,
        monetization: profile.monetization.to_string(),
        value_proposition: format!(
            "{} helps {} reach {}, with {} at the center.",
            profile.name, profile.audience, profile.outcome, spotlight
        ),
    })
}

async fn generate_idea_with_anthropic(category: &str, api_key: String) -> Result<IdeaResponse, String> {
    // Construct the prompt based on category
    let category_filter = if category == "All Categories" {
        "any domain or industry".to_string()
    } else {
        format!("the {} industry", category)
    };

    let prompt = format!(
        r#"Generate a detailed startup or application idea for {}.

Please provide the response in the following JSON format:
{{
  "concept": "A clear, concise description of the idea (2-3 sentences)",
  "platform": "Recommended platform (Web, Mobile, Desktop, or Multi-platform)",
  "target_audience": "Detailed target audience description",
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6", "feature 7", "feature 8"],
  "monetization": "Monetization strategy description",
  "value_proposition": "Clear value proposition (1-2 sentences)"
}}

Make the idea innovative, practical, and market-ready. Include 5-8 key features."#,
        category_filter
    );

    // Make API request to Anthropic
    let api_request = AnthropicRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 2048,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: prompt,
        }],
    };

    let response = HTTP_CLIENT
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
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

    // Parse the JSON response from Claude
    let response_text = api_response
        .content
        .first()
        .ok_or("No content in response")?
        .text
        .clone();

    // Extract JSON from markdown code blocks if present
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

    let idea: IdeaResponse = serde_json::from_str(json_text)
        .map_err(|e| format!("Failed to parse idea JSON: {}. Response: {}", e, json_text))?;

    Ok(idea)
}

#[tauri::command]
async fn test_api_key(api_key: String) -> Result<bool, String> {
    let test_request = AnthropicRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 10,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: "Hi".to_string(),
        }],
    };

    let response = HTTP_CLIENT
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&test_request)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    Ok(response.status().is_success())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![generate_idea, test_api_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::generate_local_idea;

    #[test]
    fn generates_a_local_idea_for_a_selected_category() {
        let idea = generate_local_idea("Education").expect("Education profile exists");

        assert_eq!(idea.category.as_deref(), Some("Education"));
        assert_eq!(idea.platform, "Web and Mobile");
        assert_eq!(idea.key_features.len(), 5);
        assert!(!idea.concept.is_empty());
        assert!(!idea.value_proposition.is_empty());
        assert!(idea.value_proposition.contains(" helps "));
    }

    #[test]
    fn all_categories_selects_a_concrete_local_idea() {
        let idea = generate_local_idea("All Categories").expect("built-in profiles exist");

        assert!(idea.category.is_some());
        assert_eq!(idea.key_features.len(), 5);
    }

    #[test]
    fn unknown_category_returns_an_error() {
        assert!(generate_local_idea("Unknown").is_err());
    }
}
