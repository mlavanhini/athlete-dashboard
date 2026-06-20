use std::fs;
use std::path::{Path, PathBuf};

use crate::models::{serialize_task, task_from_file, today_string, Task};

// ── Task commands ─────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_tasks(folder_path: String) -> Result<Vec<Task>, String> {
    let path = PathBuf::from(&folder_path);
    if !path.exists() {
        return Err(format!("Folder not found: {}", folder_path));
    }

    let mut tasks = Vec::new();

    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let ep = entry.path();
        if ep.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Ok(content) = fs::read_to_string(&ep) {
                tasks.push(task_from_file(&ep, &content));
            }
        } else if ep.is_dir() {
            if let Ok(sub_entries) = fs::read_dir(&ep) {
                for sub in sub_entries.flatten() {
                    let sp = sub.path();
                    if sp.extension().and_then(|e| e.to_str()) == Some("md") {
                        if let Ok(content) = fs::read_to_string(&sp) {
                            tasks.push(task_from_file(&sp, &content));
                        }
                    }
                }
            }
        }
    }

    tasks.sort_by(|a, b| {
        let da = a.due.as_deref().unwrap_or("9999-99-99");
        let db = b.due.as_deref().unwrap_or("9999-99-99");
        da.cmp(db).then(a.title.cmp(&b.title))
    });

    Ok(tasks)
}

#[tauri::command]
pub fn get_task(file_path: String) -> Result<Task, String> {
    let path = PathBuf::from(&file_path);
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(task_from_file(&path, &content))
}

#[tauri::command]
pub fn create_task(folder_path: String, task: Task) -> Result<Task, String> {
    let folder = PathBuf::from(&folder_path);

    let file_name = if task.file_name.is_empty() {
        let slug: String = task
            .title
            .to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-");
        let slug = if slug.len() > 40 { slug[..40].to_string() } else { slug };
        format!("{}-{}.md", today_string(), slug)
    } else {
        task.file_name.clone()
    };

    let file_path = folder.join(&file_name);

    let mut t = task.clone();
    t.file_name = file_name.clone();
    t.file_path = file_path.to_string_lossy().to_string();
    t.id = file_name;
    if t.created.is_none() || t.created.as_deref() == Some("") {
        t.created = Some(today_string());
    }

    let content = serialize_task(&t);
    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    Ok(t)
}

#[tauri::command]
pub fn update_task(task: Task) -> Result<Task, String> {
    let path = PathBuf::from(&task.file_path);
    let content = serialize_task(&task);
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(task)
}

#[tauri::command]
pub fn delete_task(file_path: String) -> Result<(), String> {
    fs::remove_file(&file_path).map_err(|e| e.to_string())
}

// ── Note types & commands ─────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteInfo {
    pub name: String,
    pub path: String,
    pub relative_path: String,
}

#[tauri::command]
pub fn list_notes(folder_path: String) -> Result<Vec<NoteInfo>, String> {
    let base = PathBuf::from(&folder_path);
    if !base.exists() {
        return Err(format!("Folder not found: {}", folder_path));
    }
    let mut notes = Vec::new();
    collect_md_files(&base, &base, &mut notes, 0)?;
    notes.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(notes)
}

fn collect_md_files(
    base: &Path,
    dir: &Path,
    notes: &mut Vec<NoteInfo>,
    depth: u32,
) -> Result<(), String> {
    if depth > 4 {
        return Ok(());
    }
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let ep = entry.path();
        let name = ep.file_name().unwrap_or_default().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        if ep.extension().and_then(|e| e.to_str()) == Some("md") {
            let relative = ep
                .strip_prefix(base)
                .unwrap_or(&ep)
                .to_string_lossy()
                .to_string();
            notes.push(NoteInfo {
                name,
                path: ep.to_string_lossy().to_string(),
                relative_path: relative,
            });
        } else if ep.is_dir() {
            collect_md_files(base, &ep, notes, depth + 1)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn read_note(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_note(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(folder_path: String, name: String) -> Result<NoteInfo, String> {
    let mut file_name = name.trim().to_string();
    if !file_name.ends_with(".md") {
        file_name.push_str(".md");
    }
    let path = PathBuf::from(&folder_path).join(&file_name);
    if path.exists() {
        return Err(format!("File already exists: {}", file_name));
    }
    let title = file_name.trim_end_matches(".md");
    fs::write(&path, format!("# {}\n\n", title)).map_err(|e| e.to_string())?;
    Ok(NoteInfo {
        name: file_name.clone(),
        path: path.to_string_lossy().to_string(),
        relative_path: file_name,
    })
}

#[tauri::command]
pub fn delete_note(file_path: String) -> Result<(), String> {
    fs::remove_file(&file_path).map_err(|e| e.to_string())
}
