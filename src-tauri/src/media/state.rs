use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Manager};
use tauri_plugin_shell::process::CommandChild;

/// Tracks in-flight ffmpeg sidecar sessions so they can be cancelled and
/// gives each session an isolated cache directory (one remux/transcode job
/// per session, cleaned up independently of the others).
#[derive(Default)]
pub struct MediaState {
    children: Mutex<HashMap<String, CommandChild>>,
}

impl MediaState {
    pub fn track(&self, session_id: &str, child: CommandChild) {
        self.children.lock().unwrap().insert(session_id.to_string(), child);
    }

    pub fn untrack(&self, session_id: &str) {
        self.children.lock().unwrap().remove(session_id);
    }

    pub fn cancel(&self, session_id: &str) -> Result<(), String> {
        if let Some(child) = self.children.lock().unwrap().remove(session_id) {
            child.kill().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn session_dir(&self, app: &AppHandle, session_id: &str) -> Result<PathBuf, String> {
        let base = app
            .path()
            .app_cache_dir()
            .map_err(|e| format!("could not resolve app cache dir: {e}"))?;
        Ok(base.join("etheria-media").join(session_id))
    }
}
