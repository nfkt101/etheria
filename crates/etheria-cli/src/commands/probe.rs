use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{bail, Result};
use media_core::{is_remux_eligible, probe};

use crate::tools::resolve;

pub fn run(ffprobe_path: &Option<PathBuf>, file: &Path, json: bool) -> Result<()> {
    let ffprobe = resolve(ffprobe_path, "ffprobe")?;
    let output = Command::new(&ffprobe)
        .args(probe::ffprobe_args(file))
        .output()?;

    if !output.status.success() {
        bail!("ffprobe failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    let info = probe::parse_probe_json(&output.stdout)?;

    if json {
        println!("{}", serde_json::to_string_pretty(&info)?);
        return Ok(());
    }

    println!("Container : {}", info.container);
    println!("Duration  : {:.1}s", info.duration_secs);
    println!("Streams   :");
    for s in &info.streams {
        let dims = match (s.width, s.height) {
            (Some(w), Some(h)) => format!(" {w}x{h}"),
            _ => String::new(),
        };
        let lang = s
            .language
            .as_deref()
            .map(|l| format!(" [{l}]"))
            .unwrap_or_default();
        println!(
            "  #{:<3} {:<10} {:<10}{}{}",
            s.index, s.codec_type, s.codec_name, dims, lang
        );
    }

    println!();
    if is_remux_eligible(&info) {
        println!("Remux-eligible: a stream-copy to MP4 would work (no re-encode needed).");
    } else {
        println!("Not remux-eligible: a full transcode would be needed for browser/webview playback.");
    }

    Ok(())
}
