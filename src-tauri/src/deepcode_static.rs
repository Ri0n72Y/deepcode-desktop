use serde::Serialize;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::{env, fs};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSessionSummary {
    pub id: String,
    pub summary: Option<String>,
    pub status: Option<String>,
    pub create_time: Option<String>,
    pub update_time: Option<String>,
    pub model: Option<String>,
    pub thinking_enabled: Option<bool>,
    pub reasoning_effort: Option<String>,
    pub active_tokens: Option<u64>,
    pub compact_prompt_token_threshold: Option<u64>,
    pub usage: Option<Value>,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSessionResult {
    pub session_id: String,
    pub project_code: String,
    pub model: Option<String>,
    pub thinking_enabled: Option<bool>,
    pub reasoning_effort: Option<String>,
    pub active_tokens: Option<u64>,
    pub compact_prompt_token_threshold: Option<u64>,
    pub usage: Option<Value>,
    pub messages: Vec<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSkillInfo {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub is_loaded: bool,
}

#[tauri::command]
pub fn read_deepcode_history() -> Result<StaticHistoryResult, String> {
    let root = deepcode_dir()?.join("projects");
    let mut projects = Vec::new();
    if root.exists() {
        for entry in fs::read_dir(&root).map_err(to_string)? {
            let path = entry.map_err(to_string)?.path();
            if !path.is_dir() {
                continue;
            }
            match read_project_history(&path) {
                Ok(Some(project)) => projects.push(project),
                Ok(None) | Err(_) => continue,
            }
        }
    }
    projects.sort_by(|left, right| latest_update(right).cmp(&latest_update(left)));
    Ok(StaticHistoryResult { root_path: path_to_string(&root), projects })
}

#[tauri::command]
pub fn read_deepcode_session(session_id: String) -> Result<StaticSessionResult, String> {
    let projects_root = deepcode_dir()?.join("projects");
    for project in fs::read_dir(&projects_root).map_err(to_string)? {
        let project_path = project.map_err(to_string)?.path();
        let session_path = project_path.join(format!("{session_id}.jsonl"));
        if session_path.exists() {
            let project_code = project_path.file_name().and_then(|value| value.to_str()).unwrap_or("unknown").to_string();
            let summary = read_session_summary(&project_path, &session_id).ok().flatten();
            return Ok(StaticSessionResult {
                session_id,
                project_code,
                model: summary.as_ref().and_then(|entry| entry.model.clone()),
                thinking_enabled: summary.as_ref().and_then(|entry| entry.thinking_enabled),
                reasoning_effort: summary.as_ref().and_then(|entry| entry.reasoning_effort.clone()),
                active_tokens: summary.as_ref().and_then(|entry| entry.active_tokens),
                compact_prompt_token_threshold: summary.as_ref().and_then(|entry| entry.compact_prompt_token_threshold),
                usage: summary.and_then(|entry| entry.usage),
                messages: read_jsonl_values(&session_path)?,
            });
        }
    }
    Err(format!("Session file not found: {session_id}"))
}

#[tauri::command]
pub fn read_deepcode_skills() -> Result<Vec<StaticSkillInfo>, String> {
    let mut skills = Vec::new();
    for root in skill_roots()? {
        if root.exists() {
            read_skills_from_root(&root, &mut skills)?;
        }
    }
    skills.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(skills)
}

#[tauri::command]
pub fn read_deepcode_settings() -> Result<StaticSettingsResult, String> {
    let path = deepcode_dir()?.join("settings.json");
    let exists = path.exists();
    let config = if exists {
        serde_json::from_str(&fs::read_to_string(&path).map_err(to_string)?).map_err(to_string)?
    } else {
        json!({
            "env": { "API_KEY": "", "BASE_URL": "https://api.deepseek.com", "MODEL": "deepseek-v4-pro" },
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
    let index: Value = serde_json::from_str(&fs::read_to_string(&index_path).map_err(to_string)?).map_err(to_string)?;
    let entries = index.get("entries").and_then(Value::as_array).cloned().unwrap_or_default();
    let sessions = entries.into_iter().filter_map(session_from_value).collect::<Vec<_>>();
    let project_code = path.file_name().and_then(|value| value.to_str()).unwrap_or("unknown").to_string();
    let original_path = index.get("originalPath").and_then(Value::as_str).map(str::to_string);
    Ok(Some(StaticProjectHistory { project_code, project_path: path_to_string(path), original_path, sessions }))
}

fn read_session_summary(project_path: &Path, session_id: &str) -> Result<Option<StaticSessionSummary>, String> {
    let index_path = project_path.join("sessions-index.json");
    if !index_path.exists() {
        return Ok(None);
    }
    let index: Value = serde_json::from_str(&fs::read_to_string(&index_path).map_err(to_string)?).map_err(to_string)?;
    let entries = index.get("entries").and_then(Value::as_array).cloned().unwrap_or_default();
    Ok(entries.into_iter().filter_map(session_from_value).find(|entry| entry.id == session_id))
}

fn session_from_value(value: Value) -> Option<StaticSessionSummary> {
    Some(StaticSessionSummary {
        id: value.get("id")?.as_str()?.to_string(),
        summary: value.get("summary").and_then(Value::as_str).map(str::to_string),
        status: value.get("status").and_then(Value::as_str).map(str::to_string),
        create_time: value.get("createTime").and_then(Value::as_str).map(str::to_string),
        update_time: value.get("updateTime").and_then(Value::as_str).map(str::to_string),
        model: value.get("model").and_then(Value::as_str).map(str::to_string),
        thinking_enabled: value.get("thinkingEnabled").and_then(Value::as_bool),
        reasoning_effort: value.get("reasoningEffort").and_then(Value::as_str).map(str::to_string),
        active_tokens: value.get("activeTokens").and_then(Value::as_u64),
        compact_prompt_token_threshold: value.get("compactPromptTokenThreshold").and_then(Value::as_u64),
        usage: value.get("usage").cloned(),
    })
}

fn read_jsonl_values(path: &Path) -> Result<Vec<Value>, String> {
    let text = fs::read_to_string(path).map_err(to_string)?;
    Ok(text.lines().filter_map(|line| serde_json::from_str::<Value>(line).ok()).collect())
}

fn read_skills_from_root(root: &Path, skills: &mut Vec<StaticSkillInfo>) -> Result<(), String> {
    for entry in fs::read_dir(root).map_err(to_string)? {
        let path = entry.map_err(to_string)?.path();
        if path.is_dir() || path.extension().and_then(|value| value.to_str()) == Some("md") {
            let name = path.file_stem().and_then(|value| value.to_str()).unwrap_or("skill").to_string();
            skills.push(StaticSkillInfo { name, path: path_to_string(&path), description: read_skill_description(&path), is_loaded: false });
        }
    }
    Ok(())
}

fn read_skill_description(path: &Path) -> Option<String> {
    let file = if path.is_dir() { path.join("SKILL.md") } else { path.to_path_buf() };
    fs::read_to_string(file).ok()?.lines().find(|line| !line.trim().is_empty()).map(|line| line.trim_start_matches('#').trim().to_string())
}

fn skill_roots() -> Result<Vec<PathBuf>, String> {
    let cwd = env::current_dir().map_err(to_string)?;
    Ok(vec![home_dir()?.join(".agents/skills"), cwd.join(".agents/skills"), cwd.join(".deepcode/skills")])
}

fn latest_update(project: &StaticProjectHistory) -> String {
    project.sessions.iter().filter_map(|session| session.update_time.clone()).max().unwrap_or_default()
}

fn deepcode_dir() -> Result<PathBuf, String> { Ok(home_dir()?.join(".deepcode")) }
fn home_dir() -> Result<PathBuf, String> {
    env::var("HOME").or_else(|_| env::var("USERPROFILE")).map(PathBuf::from).map_err(|_| "Could not resolve home directory".to_string())
}
fn path_to_string(path: &Path) -> String { path.to_string_lossy().to_string() }
fn to_string(error: impl ToString) -> String { error.to_string() }
