use std::path::{Path, PathBuf};

use anyhow::Result;
use media_core::remux::{ffmpeg_args, plan_remux};
use media_core::Session;

use crate::spawn::run_ffmpeg_with_progress;
use crate::tools::resolve;

pub fn run(ffmpeg_path: &Option<PathBuf>, file: &Path, output_dir: Option<PathBuf>) -> Result<()> {
    let ffmpeg = resolve(ffmpeg_path, "ffmpeg")?;
    let base = output_dir.unwrap_or_else(std::env::temp_dir);
    let session = Session::create(&base)?;
    let plan = plan_remux(&session);
    let args = ffmpeg_args(file, &plan);

    println!(
        "Remuxing {} -> {}",
        file.display(),
        plan.output_path.display()
    );
    run_ffmpeg_with_progress(&ffmpeg, &args, "remux")?;
    println!("Done: {}", plan.output_path.display());
    Ok(())
}
