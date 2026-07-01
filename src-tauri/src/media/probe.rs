use tauri_plugin_shell::ShellExt;

/// Runs ffprobe via the bundled sidecar and hands the raw output to
/// media_core for parsing. Deliberately doesn't decide "is this playable"
/// here - actual webview codec support varies per OS/webview build, so that
/// call is made in the frontend via `video.canPlayType()` against the live
/// engine, with an `onerror` fallback to Tier 2 processing as the final
/// authority.
#[tauri::command]
pub async fn probe_media(app: tauri::AppHandle, path: String) -> Result<media_core::MediaProbe, String> {
    let output = app
        .shell()
        .sidecar("ffprobe")
        .map_err(|e| e.to_string())?
        .args(media_core::probe::ffprobe_args(std::path::Path::new(&path)))
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    media_core::probe::parse_probe_json(&output.stdout).map_err(|e| e.to_string())
}
