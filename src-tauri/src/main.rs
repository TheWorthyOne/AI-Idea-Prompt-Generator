// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::Manager;

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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![generate_idea, test_api_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
