use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct StreamInfo {
    pub index: u32,
    /// "video" | "audio" | "subtitle", straight from ffprobe's codec_type.
    pub codec_type: String,
    pub codec_name: String,
    pub language: Option<String>,
    pub title: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub channels: Option<u32>,
}

impl StreamInfo {
    pub fn is_video(&self) -> bool {
        self.codec_type == "video"
    }

    pub fn is_audio(&self) -> bool {
        self.codec_type == "audio"
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MediaProbe {
    /// Raw ffprobe format_name, e.g. "matroska,webm" or "mov,mp4,m4a,3gp,3g2,mj2".
    pub container: String,
    pub duration_secs: f64,
    pub streams: Vec<StreamInfo>,
}

impl MediaProbe {
    pub fn video_streams(&self) -> impl Iterator<Item = &StreamInfo> {
        self.streams.iter().filter(|s| s.is_video())
    }

    pub fn audio_streams(&self) -> impl Iterator<Item = &StreamInfo> {
        self.streams.iter().filter(|s| s.is_audio())
    }

    pub fn is_mkv_labeled(&self) -> bool {
        self.container.contains("matroska")
    }
}

/// A source-agnostic progress tick emitted while ffmpeg runs. Callers turn
/// this into whatever they need: a Tauri event, a CLI progress bar, a log line.
#[derive(Debug, Clone, PartialEq)]
pub enum ProgressEvent {
    /// Parsed from ffmpeg's stderr `time=HH:MM:SS.ss` field.
    TimeUpdate { seconds: f64 },
    /// An HLS segment file has been written (transcode only).
    SegmentWritten { count: u32 },
}
