use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use super::state::MediaState;

#[derive(Debug, Serialize, Clone)]
pub struct RemuxResult {
    pub session_id: String,
    pub output_path: String,
}

#[derive(Debug, Serialize, Clone)]
struct RemuxProgress {
    session_id: String,
    out_time_secs: f64,
}

/// Stream-copy remux (no re-encode): fixes "wrong container, right codecs"
/// cases like an H.264/AAC video stuck in an MKV wrapper the webview won't
/// open. This is CPU-cheap (bounded by disk I/O, not decode/encode) so it
/// runs to completion rather than being served incrementally like the HLS
/// transcode path.
#[tauri::command]
pub async fn remux_to_mp4(
    app: AppHandle,
    state: tauri::State<'_, MediaState>,
    path: String,
) -> Result<RemuxResult, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let session_dir = state.session_dir(&app, &session_id)?;
    std::fs::create_dir_all(&session_dir).map_err(|e| e.to_string())?;
    let output_path = session_dir.join("remuxed.mp4");
    let output_path_str = output_path.to_string_lossy().to_string();

    let (mut rx, child) = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args([
            "-y",
            "-i",
            &path,
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            &output_path_str,
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

    state.track(&session_id, child);

    let mut exit_ok = false;
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stderr(line) => {
                if let Some(secs) = parse_ffmpeg_time(&String::from_utf8_lossy(&line)) {
                    let _ = app.emit(
                        "media://remux-progress",
                        RemuxProgress {
                            session_id: session_id.clone(),
                            out_time_secs: secs,
                        },
                    );
                }
            }
            CommandEvent::Error(err) => {
                state.untrack(&session_id);
                return Err(err);
            }
            CommandEvent::Terminated(payload) => {
                exit_ok = payload.code == Some(0);
            }
            _ => {}
        }
    }

    state.untrack(&session_id);
    if !exit_ok {
        return Err("ffmpeg remux did not exit cleanly".to_string());
    }

    Ok(RemuxResult {
        session_id,
        output_path: output_path_str,
    })
}

/// Parses ffmpeg's stderr progress line (`... time=00:01:23.45 ...`) into
/// seconds. Shared with the HLS transcode path.
pub(crate) fn parse_ffmpeg_time(line: &str) -> Option<f64> {
    let idx = line.find("time=")?;
    let token = line[idx + 5..].split_whitespace().next()?;
    let mut parts = token.split(':');
    let h: f64 = parts.next()?.parse().ok()?;
    let m: f64 = parts.next()?.parse().ok()?;
    let s: f64 = parts.next()?.parse().ok()?;
    Some(h * 3600.0 + m * 60.0 + s)
}
