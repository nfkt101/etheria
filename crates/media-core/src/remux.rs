use std::ffi::OsString;
use std::path::{Path, PathBuf};

use crate::session::Session;

/// Where a stream-copy remux writes its output within a session directory.
#[derive(Debug, Clone)]
pub struct RemuxPlan {
    pub output_path: PathBuf,
}

pub fn plan_remux(session: &Session) -> RemuxPlan {
    RemuxPlan {
        output_path: session.dir.join("remuxed.mp4"),
    }
}

/// ffmpeg args for a stream-copy remux (no re-encode): fixes "wrong
/// container, right codecs" cases like H.264/AAC stuck in an MKV wrapper.
/// CPU-cheap - bounded by disk I/O, not decode/encode.
pub fn ffmpeg_args(input: &Path, plan: &RemuxPlan) -> Vec<OsString> {
    vec![
        "-y".into(),
        "-i".into(),
        input.as_os_str().to_owned(),
        "-c".into(),
        "copy".into(),
        "-movflags".into(),
        "+faststart".into(),
        plan.output_path.as_os_str().to_owned(),
    ]
}
