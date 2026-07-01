use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use media_core::{parse_ffmpeg_time_line, transcode, Session};

use super::state::MediaState;

#[derive(Debug, Serialize, Clone)]
pub struct TranscodeStarted {
    pub session_id: String,
    pub manifest_path: String,
}

#[derive(Debug, Serialize, Clone)]
struct TranscodeProgress {
    session_id: String,
    out_time_secs: f64,
}

/// Starts an ffmpeg HLS transcode for files whose codecs (not just
/// container) the webview can't play. Segments are written as they're
/// encoded and the command returns as soon as the first segment exists, so
/// playback (via hls.js) can begin before the whole file has been
/// processed - the same "start watching while it transcodes" behavior
/// Jellyfin's own server-side transcoder gives you. Arg-building/planning
/// comes from media_core; this layer only owns spawning it as a Tauri
/// sidecar and reporting progress/state.
#[tauri::command]
pub async fn transcode_to_hls(
    app: AppHandle,
    state: tauri::State<'_, MediaState>,
    path: String,
    video_codec: Option<String>,
    audio_codec: Option<String>,
) -> Result<TranscodeStarted, String> {
    let base_dir = state.base_dir(&app)?;
    let session = Session::create(&base_dir).map_err(|e| e.to_string())?;
    let plan = transcode::plan_transcode(&session);
    let manifest_path_str = plan.manifest_path.to_string_lossy().to_string();

    let vcodec = video_codec.unwrap_or_else(|| transcode::DEFAULT_VIDEO_CODEC.to_string());
    let acodec = audio_codec.unwrap_or_else(|| transcode::DEFAULT_AUDIO_CODEC.to_string());
    let args = transcode::ffmpeg_args(std::path::Path::new(&path), &plan, &vcodec, &acodec);

    let (mut rx, child) = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    state.track(&session.id, child);

    // Drive progress/cleanup for the rest of the session's life in the
    // background; the command itself only waits for the first segment.
    let app_events = app.clone();
    let session_for_events = session.id.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stderr(line) => {
                    if let Some(secs) = parse_ffmpeg_time_line(&String::from_utf8_lossy(&line)) {
                        let _ = app_events.emit(
                            "media://transcode-progress",
                            TranscodeProgress {
                                session_id: session_for_events.clone(),
                                out_time_secs: secs,
                            },
                        );
                    }
                }
                CommandEvent::Terminated(_) | CommandEvent::Error(_) => break,
                _ => {}
            }
        }
        app_events
            .state::<MediaState>()
            .untrack(&session_for_events);
        let _ = app_events.emit("media://transcode-done", session_for_events.clone());
    });

    wait_for_first_segment(&plan.manifest_path, &session.id, &state).await?;

    Ok(TranscodeStarted {
        session_id: session.id,
        manifest_path: manifest_path_str,
    })
}

async fn wait_for_first_segment(
    manifest_path: &std::path::Path,
    session_id: &str,
    state: &tauri::State<'_, MediaState>,
) -> Result<(), String> {
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(30);
    loop {
        if let Ok(contents) = std::fs::read_to_string(manifest_path) {
            if transcode::manifest_has_playable_segment(&contents) {
                return Ok(());
            }
        }
        if std::time::Instant::now() > deadline {
            let _ = state.cancel(session_id);
            return Err("Timed out waiting for the first HLS segment".to_string());
        }
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;
    }
}

/// Kills the ffmpeg sidecar for a session (remux or transcode) and leaves
/// its cache directory for `cleanup_session` to remove explicitly, so a
/// player that's still reading segments during cancellation doesn't race a
/// delete.
#[tauri::command]
pub fn cancel_processing(state: tauri::State<'_, MediaState>, session_id: String) -> Result<(), String> {
    state.cancel(&session_id)
}

#[tauri::command]
pub fn cleanup_session(app: AppHandle, state: tauri::State<'_, MediaState>, session_id: String) -> Result<(), String> {
    let dir = state.session_dir(&app, &session_id)?;
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
