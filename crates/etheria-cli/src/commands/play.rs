use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{bail, Context, Result};

use crate::tools::resolve;

/// Real VLC-like instant playback: ffplay shares ffmpeg's decoders, so it
/// handles virtually any container/codec directly - no remux/transcode
/// needed. That pipeline exists purely to work around browser/webview
/// codec limits, not ffplay's.
pub fn run(ffplay_path: &Option<PathBuf>, file: &Path, fullscreen: bool) -> Result<()> {
    let ffplay = resolve(ffplay_path, "ffplay")?;

    let mut cmd = Command::new(&ffplay);
    cmd.arg("-window_title")
        .arg(file.file_name().unwrap_or(file.as_os_str()));
    if fullscreen {
        cmd.arg("-fs");
    }
    cmd.arg(file);

    let status = cmd
        .status()
        .with_context(|| format!("failed to launch ffplay for {}", file.display()))?;
    if !status.success() {
        bail!("ffplay exited with status {status}");
    }
    Ok(())
}
