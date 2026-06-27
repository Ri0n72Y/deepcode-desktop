use serde::Serialize;
use serde_json::Value;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSessionSummary {
    pub id: String,
    pub summary: Option<String>,
    pub status: Option<String>,
    pub create_time: Option<String>,
    pub update_time: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticProjectHistory {
    pub project_code: String,
    pub project_path: String,
    pub original_path: Option<String>,
    pub sessions: Vec<StaticSessionSummary>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticHistoryResult {
    pub root_path: String,
    pub projects: Vec<StaticProjectHistory>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSettingsResult {
    pub path: String,
    pub exists: bool,
    pub config: Value,
}

#[tauri::command]
pub fn read_deepcode_history() -> Result<StaticHistoryResult, String> {
    let root = deepcode_dir()?.join("projects");
    let mut projects = Vec::new();

    if root.exists() {
        for entry in fs::read_dir(&root).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            if let Some(project) = read_project_history(&path)? {
                projects.push(project);
            }
        }
    }

    projects.sort_by(|left, right| latest_update(right).cmp(&latest_update(left)));
    Ok(StaticHistoryResult { root_path: path_to_string(&root), projects })
}

#[tauri::command]
pub fn read_deepcode_settings() -> Result<StaticSettingsResult, String> {
    let path = deepcode_dir()?.join("settings.json");
    let exists = path.exists();
    let config = if exists {
        let text = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        serde_json::from_str(&text).map_err(|error| error.to_string())?
    } else {
        serde_json::json!({
            "env": {
                "API_KEY": "",
                "BASE_URL": "https://api.deepseek.com",
                "MODEL": "deepseek-v4-pro"
            },
            "thinkingEnabled": true,
            "reasoningEffort": "max",
            "notify": ""
        })
    };

    Ok(StaticSettingsResult { path: path_to_string(&path), exists, config })
}

fn read_project_history(path: &Path) -> Result<Option<StaticProjectHistory>, String> {
    let index_path = path.join("sessions-index.json");
    if !index_path.exists() {
        return Ok(None);
    }

    let text = fs::read_to_string(&index_path).map_err(|error| error.to_string())?;
    let index: Value = serde_json::from_str(&text).map_err(|error| error.to_string())?;
    let entries = index.get("entries").and_then(Value::as_array).cloned().unwrap_or_default();
    let sessions = entries.into_iter().filter_map(session_from_value).collect::<Vec<_>>();
    let project_code = path.file_name().and_then(|value| value.to_str()).unwrap_or("unknown").to_string();
    let original_path = index.get("originalPath").and_then(Value::as_str).map(str::to_string);

    Ok(Some(StaticProjectHistory {
        project_code,
        project_path: path_to_string(path),
        original_path,
        sessions,
    }))
}

fn session_from_value(value: Value) -> Option<StaticSessionSummary> {
    Some(StaticSessionSummary {
        id: value.get("id")?.as_str()?.to_string(),
        summary: value.get("summary").and_then(Value::as_str).map(str::to_string),
        status: value.get("status").and_then(Value::as_str).map(str::to_string),
        create_time: value.get("createTime").and_then(Value::as_str).map(str::to_string),
        update_time: value.get("updateTime").and_then(Value::as_str).map(str::to_string),
    })
}

fn latest_update(project: &StaticProjectHistory) -> String {
    project
        .sessions
        .iter()
        .filter_map(|session| session.update_time.clone())
        .max()
        .unwrap_or_default()
}

fn deepcode_dir() -> Result<PathBuf, String> {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Could not resolve home directory".to_string())?;
    Ok(PathBuf::from(home).join(".deepcode"))
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}
