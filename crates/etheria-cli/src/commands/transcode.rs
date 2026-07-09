use std::path::{Path, PathBuf};

use anyhow::Result;
use media_core::transcode::{ffmpeg_args, plan_transcode};
use media_core::Session;

use crate::spawn::run_ffmpeg_with_progress;
use crate::tools::resolve;

#[allow(clippy::too_many_arguments)]
pub fn run(
    ffmpeg_path: &Option<PathBuf>,
    file: &Path,
    output_dir: Option<PathBuf>,
    video_codec: &str,
    audio_codec: &str,
) -> Result<()> {
    let ffmpeg = resolve(ffmpeg_path, "ffmpeg")?;
    let base = output_dir.unwrap_or_else(std::env::temp_dir);
    let session = Session::create(&base)?;
    let plan = plan_transcode(&session);
    let args = ffmpeg_args(file, &plan, video_codec, audio_codec);

    println!(
        "Transcoding {} -> {} ({video_codec}/{audio_codec})",
        file.display(),
        plan.manifest_path.display()
    );
    run_ffmpeg_with_progress(&ffmpeg, &args, "transcode")?;
    println!("Done: {}", plan.manifest_path.display());
    Ok(())
}
