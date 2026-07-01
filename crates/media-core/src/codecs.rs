use crate::types::MediaProbe;

/// Video codecs a stream-copy remux can safely repackage without re-encoding.
pub const REMUXABLE_VIDEO_CODECS: &[&str] = &["h264", "vp8", "vp9", "av1"];

/// Audio codecs a stream-copy remux can safely repackage without re-encoding.
pub const REMUXABLE_AUDIO_CODECS: &[&str] = &["aac", "opus", "vorbis", "mp3", "flac"];

/// True when every stream's *codec* is already something a plain container
/// swap can carry as-is - i.e. only the container itself is the problem
/// (e.g. H.264/AAC stuck in an MKV wrapper), not the codecs inside it.
pub fn is_remux_eligible(probe: &MediaProbe) -> bool {
    probe
        .video_streams()
        .all(|s| REMUXABLE_VIDEO_CODECS.contains(&s.codec_name.as_str()))
        && probe
            .audio_streams()
            .all(|s| REMUXABLE_AUDIO_CODECS.contains(&s.codec_name.as_str()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::StreamInfo;

    fn stream(codec_type: &str, codec_name: &str) -> StreamInfo {
        StreamInfo {
            index: 0,
            codec_type: codec_type.to_string(),
            codec_name: codec_name.to_string(),
            language: None,
            title: None,
            width: None,
            height: None,
            channels: None,
        }
    }

    #[test]
    fn h264_aac_in_mkv_is_remux_eligible() {
        let probe = MediaProbe {
            container: "matroska,webm".into(),
            duration_secs: 1.0,
            streams: vec![stream("video", "h264"), stream("audio", "aac")],
        };
        assert!(is_remux_eligible(&probe));
    }

    #[test]
    fn hevc_is_not_remux_eligible() {
        let probe = MediaProbe {
            container: "matroska,webm".into(),
            duration_secs: 1.0,
            streams: vec![stream("video", "hevc"), stream("audio", "aac")],
        };
        assert!(!is_remux_eligible(&probe));
    }

    #[test]
    fn dts_audio_is_not_remux_eligible() {
        let probe = MediaProbe {
            container: "matroska,webm".into(),
            duration_secs: 1.0,
            streams: vec![stream("video", "h264"), stream("audio", "dts")],
        };
        assert!(!is_remux_eligible(&probe));
    }
}
