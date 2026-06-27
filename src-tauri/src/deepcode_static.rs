use serde::Serialize;
use serde_json::{json, Value};
use std::{env, fs};
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSessionResult {
    pub session_id: String,
    pub project_code: String,
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
            if path.is_dir() {
                if let Some(project) = read_project_history(&path)? {
                    projects.push(project);
                }
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
            return Ok(StaticSessionResult { session_id, project_code, messages: read_jsonl_values(&session_path)? });
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
    if !index_path.exists() { return Ok(None); }
    let index: Value = serde_json::from_str(&fs::read_to_string(&index_path).map_err(to_string)?).map_err(to_string)?;
    let entries = index.get("entries").and_then(Value::as_array).cloned().unwrap_or_default();
    let sessions = entries.into_iter().filter_map(session_from_value).collect::<Vec<_>>();
    let project_code = path.file_name().and_then(|value| value.to_str()).unwrap_or("unknown").to_string();
    let original_path = index.get("originalPath").and_then(Value::as_str).map(str::to_string);
    Ok(Some(StaticProjectHistory { project_code, project_path: path_to_string(path), original_path, sessions }))
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
