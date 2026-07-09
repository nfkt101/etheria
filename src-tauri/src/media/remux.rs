use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use media_core::{parse_ffmpeg_time_line, remux, Session};

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
/// transcode path. Arg-building/planning comes from media_core; this layer
/// only owns spawning it as a Tauri sidecar and reporting progress/state.
#[tauri::command]
pub async fn remux_to_mp4(
    app: AppHandle,
    state: tauri::State<'_, MediaState>,
    path: String,
) -> Result<RemuxResult, String> {
    let base_dir = state.base_dir(&app)?;
    let session = Session::create(&base_dir).map_err(|e| e.to_string())?;
    let plan = remux::plan_remux(&session);
    let output_path_str = plan.output_path.to_string_lossy().to_string();
    let args = remux::ffmpeg_args(std::path::Path::new(&path), &plan);

    let (mut rx, child) = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    state.track(&session.id, child);

    let mut exit_ok = false;
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stderr(line) => {
                if let Some(secs) = parse_ffmpeg_time_line(&String::from_utf8_lossy(&line)) {
                    let _ = app.emit(
                        "media://remux-progress",
                        RemuxProgress {
                            session_id: session.id.clone(),
                            out_time_secs: secs,
                        },
                    );
                }
            }
            CommandEvent::Error(err) => {
                state.untrack(&session.id);
                return Err(err);
            }
            CommandEvent::Terminated(payload) => {
                exit_ok = payload.code == Some(0);
            }
            _ => {}
        }
    }

    state.untrack(&session.id);
    if !exit_ok {
        return Err("ffmpeg remux did not exit cleanly".to_string());
    }

    Ok(RemuxResult {
        session_id: session.id,
        output_path: output_path_str,
    })
}
