use std::ffi::OsString;
use std::path::{Path, PathBuf};

use crate::session::Session;

/// h264/aac is the safe default: playable by every Tauri webview target
/// (WebView2, WKWebView, WebKitGTK) and by effectively every other player.
pub const DEFAULT_VIDEO_CODEC: &str = "libx264";
pub const DEFAULT_AUDIO_CODEC: &str = "aac";
pub const HLS_SEGMENT_SECONDS: u32 = 6;

/// Where an HLS transcode writes its manifest/segments within a session
/// directory.
#[derive(Debug, Clone)]
pub struct TranscodePlan {
    pub manifest_path: PathBuf,
    pub segment_pattern: PathBuf,
}

pub fn plan_transcode(session: &Session) -> TranscodePlan {
    TranscodePlan {
        manifest_path: session.dir.join("index.m3u8"),
        segment_pattern: session.dir.join("seg%05d.ts"),
    }
}

/// ffmpeg args for an HLS transcode. Segments are written as they're
/// encoded, so a caller can start playback (or handoff to another player)
/// as soon as the first segment exists rather than waiting for the whole
/// file to finish - the same "start watching while it transcodes" behavior
/// Jellyfin's own server-side transcoder gives you.
pub fn ffmpeg_args(
    input: &Path,
    plan: &TranscodePlan,
    video_codec: &str,
    audio_codec: &str,
) -> Vec<OsString> {
    vec![
        "-y".into(),
        "-i".into(),
        input.as_os_str().to_owned(),
        "-c:v".into(),
        video_codec.into(),
        "-preset".into(),
        "veryfast".into(),
        "-c:a".into(),
        audio_codec.into(),
        "-ac".into(),
        "2".into(),
        "-f".into(),
        "hls".into(),
        "-hls_time".into(),
        HLS_SEGMENT_SECONDS.to_string().into(),
        "-hls_list_size".into(),
        "0".into(),
        "-hls_flags".into(),
        "independent_segments+temp_file".into(),
        "-hls_segment_filename".into(),
        plan.segment_pattern.as_os_str().to_owned(),
        plan.manifest_path.as_os_str().to_owned(),
    ]
}

/// True once the manifest has at least one segment listed - i.e. there's
/// something playable, even though the transcode may still be running.
pub fn manifest_has_playable_segment(manifest_contents: &str) -> bool {
    manifest_contents.contains(".ts")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_a_playable_manifest() {
        let m3u8 = "#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:6.000000,\nseg00000.ts\n";
        assert!(manifest_has_playable_segment(m3u8));
    }

    #[test]
    fn empty_manifest_is_not_yet_playable() {
        let m3u8 = "#EXTM3U\n#EXT-X-VERSION:3\n";
        assert!(!manifest_has_playable_segment(m3u8));
    }
}
