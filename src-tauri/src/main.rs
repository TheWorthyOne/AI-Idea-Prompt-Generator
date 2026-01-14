// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

const KEYRING_SERVICE: &str = "ai-idea-prompt-generator";
const KEYRING_ACCOUNT: &str = "anthropic_api_key";

#[derive(Debug, Serialize, Deserialize)]
struct IdeaRequest {
    category: String,
    api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct IdeaResponse {
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

#[tauri::command]
async fn generate_idea(category: String, api_key: String) -> Result<IdeaResponse, String> {
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
    let client = reqwest::Client::new();
    let api_request = AnthropicRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 2048,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: prompt,
        }],
    };

    let response = client
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
    let client = reqwest::Client::new();
    let test_request = AnthropicRequest {
        model: "claude-3-5-sonnet-20241022".to_string(),
        max_tokens: 10,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: "Hi".to_string(),
        }],
    };

    let response = client
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
