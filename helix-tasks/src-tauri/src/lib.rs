mod commands;
mod models;

use commands::{
    create_note, create_task, delete_note, delete_task, get_task, list_notes, list_tasks,
    read_note, update_task, write_note,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_tasks,
            get_task,
            create_task,
            update_task,
            delete_task,
            list_notes,
            read_note,
            write_note,
            create_note,
            delete_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
