pub mod app_state;
pub mod commands;
pub mod errors;
pub mod system;

use app_state::AppState;
use commands::processes::ProcessSignal;
use errors::ApiError;
use system::models::{MetricsSnapshot, ProcessRow};
use system::processes::ProcessQuery;
use tauri::State;

fn map_api_error(error: ApiError) -> String {
    error.to_string()
}

#[tauri::command]
fn get_metrics_snapshot(state: State<'_, AppState>) -> Result<MetricsSnapshot, String> {
    commands::metrics::get_metrics_snapshot(&state).map_err(map_api_error)
}

#[tauri::command]
fn list_processes(query: Option<ProcessQuery>) -> Result<Vec<ProcessRow>, String> {
    commands::processes::list_processes(query).map_err(map_api_error)
}

#[tauri::command]
fn send_process_signal(
    state: State<'_, AppState>,
    pid: i32,
    signal: ProcessSignal,
) -> Result<(), String> {
    commands::processes::send_process_signal(&state, pid, signal).map_err(map_api_error)
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            get_metrics_snapshot,
            list_processes,
            send_process_signal
        ])
        .run(tauri::generate_context!())
        .expect("failed to run tauri app");
}
