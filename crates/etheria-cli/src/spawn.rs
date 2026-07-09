use std::ffi::OsStr;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};

use anyhow::{bail, Result};
use media_core::parse_ffmpeg_time_line;

/// Runs ffmpeg with the given args, printing a live `time=` progress line to
/// stderr as it goes (ffmpeg logs progress there, not stdout). Blocks until
/// the process exits.
pub fn run_ffmpeg_with_progress<I, S>(ffmpeg: &Path, args: I, label: &str) -> Result<()>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut child = Command::new(ffmpeg)
        .args(args)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()?;

    if let Some(stderr) = child.stderr.take() {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            if let Some(secs) = parse_ffmpeg_time_line(&line) {
                eprint!("\r{label}: {secs:>8.1}s encoded");
            }
        }
        eprintln!();
    }

    let status = child.wait()?;
    if !status.success() {
        bail!("ffmpeg exited with status {status}");
    }
    Ok(())
}
