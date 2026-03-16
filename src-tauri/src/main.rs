#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::collections::HashMap;
use std::fs;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn load_env(project_root: &std::path::Path) -> HashMap<String, String> {
  let mut map = HashMap::new();
  let env_path = project_root.join(".env");
  if let Ok(content) = fs::read_to_string(&env_path) {
    for line in content.lines() {
      let line = line.trim();
      if line.is_empty() || line.starts_with('#') { continue; }
      if let Some((key, val)) = line.split_once('=') {
        map.insert(key.trim().to_string(), val.trim().to_string());
      }
    }
  }
  map
}

fn main() {
  let exe_dir = std::env::current_exe()
    .expect("exe 경로 가져오기 실패")
    .parent()
    .expect("부모 디렉토리 없음")
    .to_path_buf();

  let project_root = exe_dir
    .join("..").join("..").join("..")
    .canonicalize()
    .unwrap_or(exe_dir.clone());

  let server_path = project_root.join("build").join("index.js");
  let env_vars    = load_env(&project_root);
  let root_clone  = project_root.clone();

  let node_process = Arc::new(Mutex::new(None::<std::process::Child>));
  let node_process_clone = node_process.clone();

  thread::spawn(move || {
    let mut cmd = Command::new("node");
    cmd.arg(&server_path).current_dir(&root_clone);
    for (k, v) in &env_vars { cmd.env(k, v); }
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    if let Ok(child) = cmd.spawn() {
      *node_process_clone.lock().unwrap() = Some(child);
    }
  });

  thread::sleep(Duration::from_secs(2));

  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_notification::init())
    .on_window_event(move |_window, event| {
      if let tauri::WindowEvent::Destroyed = event {
        if let Ok(mut guard) = node_process.lock() {
          if let Some(ref mut child) = *guard {
            let _ = child.kill();
          }
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
