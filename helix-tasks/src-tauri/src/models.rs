use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub title: String,
    pub status: String,
    pub due: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub project: Option<String>,
    pub contexts: Vec<String>,
    pub created: Option<String>,
    pub completed_at: Option<String>,
    pub body: String,
}

fn parse_frontmatter(content: &str) -> (HashMap<String, String>, String) {
    let mut fm: HashMap<String, String> = HashMap::new();

    if !content.starts_with("---") {
        return (fm, content.to_string());
    }

    let rest = &content[3..];
    // Handle both \r\n and \n line endings
    let rest = rest.trim_start_matches('\r').trim_start_matches('\n');
    let end_marker = if let Some(p) = rest.find("\n---") { p } else { return (fm, content.to_string()); };

    let yaml_part = &rest[..end_marker];
    let after = &rest[end_marker + 4..];
    let body = after.trim_start_matches('\r').trim_start_matches('\n').to_string();

    for line in yaml_part.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some(colon_pos) = line.find(':') {
            let key = line[..colon_pos].trim().to_string();
            let val = line[colon_pos + 1..].trim().to_string();
            if !key.is_empty() {
                fm.insert(key, val);
            }
        }
    }

    (fm, body)
}

fn parse_list_value(val: &str) -> Vec<String> {
    let trimmed = val.trim();
    if trimmed.starts_with('[') && trimmed.ends_with(']') {
        let inner = &trimmed[1..trimmed.len() - 1];
        inner
            .split(',')
            .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
            .filter(|s| !s.is_empty())
            .collect()
    } else if !trimmed.is_empty() {
        vec![trimmed.to_string()]
    } else {
        Vec::new()
    }
}

pub fn task_from_file(path: &Path, content: &str) -> Task {
    let (fm, body) = parse_frontmatter(content);
    let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let file_path = path.to_string_lossy().to_string();

    let title = fm
        .get("title")
        .cloned()
        .unwrap_or_else(|| file_name.trim_end_matches(".md").to_string());

    Task {
        id: file_name.clone(),
        file_name,
        file_path,
        title,
        status: fm.get("status").cloned().unwrap_or_else(|| "todo".to_string()),
        due: fm.get("due").filter(|v| !v.is_empty()).cloned(),
        priority: fm.get("priority").filter(|v| !v.is_empty()).cloned(),
        category: fm.get("category").filter(|v| !v.is_empty()).cloned(),
        project: fm.get("project").filter(|v| !v.is_empty()).cloned(),
        contexts: fm
            .get("contexts")
            .map(|v| parse_list_value(v))
            .unwrap_or_default(),
        created: fm.get("created").filter(|v| !v.is_empty()).cloned(),
        completed_at: fm
            .get("completedAt")
            .or_else(|| fm.get("completed_at"))
            .filter(|v| !v.is_empty())
            .cloned(),
        body,
    }
}

pub fn serialize_task(task: &Task) -> String {
    let mut lines = vec!["---".to_string()];
    lines.push(format!("title: {}", task.title));
    lines.push(format!("status: {}", task.status));

    if let Some(due) = &task.due {
        if !due.is_empty() {
            lines.push(format!("due: {}", due));
        }
    }
    if let Some(priority) = &task.priority {
        if !priority.is_empty() {
            lines.push(format!("priority: {}", priority));
        }
    }
    if let Some(category) = &task.category {
        if !category.is_empty() {
            lines.push(format!("category: {}", category));
        }
    }
    if let Some(project) = &task.project {
        if !project.is_empty() {
            lines.push(format!("project: {}", project));
        }
    }
    if !task.contexts.is_empty() {
        lines.push(format!("contexts: [{}]", task.contexts.join(", ")));
    }
    if let Some(created) = &task.created {
        if !created.is_empty() {
            lines.push(format!("created: {}", created));
        }
    }
    if let Some(completed_at) = &task.completed_at {
        if !completed_at.is_empty() {
            lines.push(format!("completedAt: {}", completed_at));
        }
    }

    lines.push("---".to_string());

    if !task.body.is_empty() {
        lines.push(String::new());
        lines.push(task.body.clone());
    }

    lines.join("\n")
}

pub fn today_string() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let (y, m, d) = epoch_to_ymd(secs);
    format!("{:04}-{:02}-{:02}", y, m, d)
}

fn epoch_to_ymd(secs: u64) -> (u64, u64, u64) {
    // Tomohiko Sakamoto's algorithm adapted for u64
    let days = secs / 86400 + 719468;
    let era = days / 146097;
    let doe = days - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
