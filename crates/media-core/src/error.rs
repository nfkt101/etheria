use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("ffprobe exited with a non-zero status: {stderr}")]
    ProbeFailed { stderr: String },

    #[error("ffprobe output missing '{0}'")]
    ProbeMissingField(&'static str),

    #[error("failed to parse ffprobe JSON output: {0}")]
    ProbeJson(#[from] serde_json::Error),

    #[error("ffmpeg exited with a non-zero status")]
    EncodeFailed,

    #[error("timed out waiting for the first HLS segment to appear at {0}")]
    TranscodeTimedOut(PathBuf),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}
