use std::ffi::OsString;
use std::path::Path;

use crate::error::CoreError;
use crate::types::{MediaProbe, StreamInfo};

/// Arguments for `ffprobe` to dump container/stream facts as JSON. Callers
/// are responsible for actually spawning the process with these args and
/// handing the captured stdout to [`parse_probe_json`].
pub fn ffprobe_args(path: &Path) -> Vec<OsString> {
    vec![
        "-v".into(),
        "error".into(),
        "-print_format".into(),
        "json".into(),
        "-show_format".into(),
        "-show_streams".into(),
        path.as_os_str().to_owned(),
    ]
}

/// Parses ffprobe's `-print_format json -show_format -show_streams` stdout.
pub fn parse_probe_json(stdout: &[u8]) -> Result<MediaProbe, CoreError> {
    let json: serde_json::Value = serde_json::from_slice(stdout)?;

    let format = json
        .get("format")
        .ok_or(CoreError::ProbeMissingField("format"))?;

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
        channels: s
            .get("channels")
            .and_then(|v| v.as_u64())
            .map(|v| v as u32),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_typical_ffprobe_payload() {
        let json = br#"{
            "streams": [
                {"index": 0, "codec_type": "video", "codec_name": "h264", "width": 1920, "height": 1080},
                {"index": 1, "codec_type": "audio", "codec_name": "aac", "channels": 2, "tags": {"language": "eng"}}
            ],
            "format": {"format_name": "mov,mp4,m4a,3gp,3g2,mj2", "duration": "125.44"}
        }"#;

        let probe = parse_probe_json(json).unwrap();
        assert_eq!(probe.container, "mov,mp4,m4a,3gp,3g2,mj2");
        assert!((probe.duration_secs - 125.44).abs() < f64::EPSILON);
        assert_eq!(probe.streams.len(), 2);
        assert_eq!(probe.video_streams().count(), 1);
        assert_eq!(probe.audio_streams().count(), 1);
        assert_eq!(probe.streams[1].language.as_deref(), Some("eng"));
        assert!(!probe.is_mkv_labeled());
    }

    #[test]
    fn flags_matroska_container() {
        let json = br#"{"streams": [], "format": {"format_name": "matroska,webm", "duration": "10"}}"#;
        let probe = parse_probe_json(json).unwrap();
        assert!(probe.is_mkv_labeled());
    }

    #[test]
    fn missing_format_is_an_error() {
        let json = br#"{"streams": []}"#;
        assert!(matches!(
            parse_probe_json(json),
            Err(CoreError::ProbeMissingField("format"))
        ));
    }
}
