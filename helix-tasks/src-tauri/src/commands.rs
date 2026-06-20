use std::fs;
use std::path::PathBuf;

use crate::models::{task_from_file, serialize_task, today_string, Task};

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
            // Scan one level deep
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

    // Sort by due date then title
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
