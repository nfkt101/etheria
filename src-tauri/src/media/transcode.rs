use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

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
/// Jellyfin's own server-side transcoder gives you.
#[tauri::command]
pub async fn transcode_to_hls(
    app: AppHandle,
    state: tauri::State<'_, MediaState>,
    path: String,
    video_codec: Option<String>,
    audio_codec: Option<String>,
) -> Result<TranscodeStarted, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let session_dir = state.session_dir(&app, &session_id)?;
    std::fs::create_dir_all(&session_dir).map_err(|e| e.to_string())?;

    let manifest_path = session_dir.join("index.m3u8");
    let segment_pattern = session_dir.join("seg%05d.ts");
    let manifest_path_str = manifest_path.to_string_lossy().to_string();
    let segment_pattern_str = segment_pattern.to_string_lossy().to_string();

    // h264/aac is the safe default: playable by every Tauri webview target
    // (WebView2, WKWebView, WebKitGTK) without further processing.
    let vcodec = video_codec.unwrap_or_else(|| "libx264".to_string());
    let acodec = audio_codec.unwrap_or_else(|| "aac".to_string());

    let (mut rx, child) = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args([
            "-y",
            "-i",
            &path,
            "-c:v",
            &vcodec,
            "-preset",
            "veryfast",
            "-c:a",
            &acodec,
            "-ac",
            "2",
            "-f",
            "hls",
            "-hls_time",
            "6",
            "-hls_list_size",
            "0",
            "-hls_flags",
            "independent_segments+temp_file",
            "-hls_segment_filename",
            &segment_pattern_str,
            &manifest_path_str,
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

    state.track(&session_id, child);

    // Drive progress/cleanup for the rest of the session's life in the
    // background; the command itself only waits for the first segment.
    let app_events = app.clone();
    let session_for_events = session_id.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stderr(line) => {
                    if let Some(secs) =
                        super::remux::parse_ffmpeg_time(&String::from_utf8_lossy(&line))
                    {
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

    wait_for_first_segment(&manifest_path, &session_id, &state).await?;

    Ok(TranscodeStarted {
        session_id,
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
            if contents.contains(".ts") {
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
