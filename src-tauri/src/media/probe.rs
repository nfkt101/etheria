use serde::{Deserialize, Serialize};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StreamInfo {
    pub index: u32,
    pub codec_type: String, // "video" | "audio" | "subtitle"
    pub codec_name: String,
    pub language: Option<String>,
    pub title: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub channels: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaProbe {
    /// Raw ffprobe format_name, e.g. "matroska,webm" or "mov,mp4,m4a,3gp,3g2,mj2".
    pub container: String,
    pub duration_secs: f64,
    pub streams: Vec<StreamInfo>,
}

/// Runs ffprobe and returns the raw container/codec facts for a local file.
/// Deliberately does not decide "is this playable" here — actual webview
/// codec support varies per OS/webview build, so that call is made in the
/// frontend via `video.canPlayType()` against the live engine, with an
/// `onerror` fallback to Tier 2 processing as the final authority.
#[tauri::command]
pub async fn probe_media(app: tauri::AppHandle, path: String) -> Result<MediaProbe, String> {
    let output = app
        .shell()
        .sidecar("ffprobe")
        .map_err(|e| e.to_string())?
        .args([
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            &path,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let json: serde_json::Value =
        serde_json::from_slice(&output.stdout).map_err(|e| e.to_string())?;
    parse_probe_json(&json)
}

fn parse_probe_json(json: &serde_json::Value) -> Result<MediaProbe, String> {
    let format = json.get("format").ok_or("ffprobe output missing 'format'")?;

    let container = format
        .get("format_name")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let duration_secs = format
        .get("duration")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let streams = json
        .get("streams")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(parse_stream).collect())
        .unwrap_or_default();

    Ok(MediaProbe {
        container,
        duration_secs,
        streams,
    })
}

fn parse_stream(s: &serde_json::Value) -> StreamInfo {
    StreamInfo {
        index: s.get("index").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        codec_type: s
            .get("codec_type")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        codec_name: s
            .get("codec_name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        language: s
            .get("tags")
            .and_then(|t| t.get("language"))
            .and_then(|v| v.as_str())
            .map(String::from),
        title: s
            .get("tags")
            .and_then(|t| t.get("title"))
            .and_then(|v| v.as_str())
            .map(String::from),
        width: s.get("width").and_then(|v| v.as_u64()).map(|v| v as u32),
        height: s.get("height").and_then(|v| v.as_u64()).map(|v| v as u32),
        channels: s.get("channels").and_then(|v| v.as_u64()).map(|v| v as u32),
    }
}
