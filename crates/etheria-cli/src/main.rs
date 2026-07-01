mod commands;
mod spawn;
mod tools;

use std::path::PathBuf;

use anyhow::Result;
use clap::{Parser, Subcommand};

/// Etheria's VLC-like media pipeline, standalone: probe a file, remux/
/// transcode it for browser-compatible playback, or just play it directly.
#[derive(Parser)]
#[command(name = "etheria", version, about)]
struct Cli {
    /// Path to the ffmpeg binary (defaults to a PATH lookup)
    #[arg(long, global = true)]
    ffmpeg_path: Option<PathBuf>,

    /// Path to the ffprobe binary (defaults to a PATH lookup)
    #[arg(long, global = true)]
    ffprobe_path: Option<PathBuf>,

    /// Path to the ffplay binary (defaults to a PATH lookup), used by `play`
    #[arg(long, global = true)]
    ffplay_path: Option<PathBuf>,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Print container/codec/stream info for a file
    Probe {
        file: PathBuf,
        /// Print raw JSON instead of a human-readable summary
        #[arg(long)]
        json: bool,
    },
    /// Stream-copy remux into an MP4 (fixes "wrong container, right codecs")
    Remux {
        file: PathBuf,
        /// Directory to write the remuxed file's session folder into (defaults to the system temp dir)
        #[arg(short, long)]
        output_dir: Option<PathBuf>,
    },
    /// Transcode to HLS for maximum playback compatibility
    Transcode {
        file: PathBuf,
        /// Directory to write the transcode session folder into (defaults to the system temp dir)
        #[arg(short, long)]
        output_dir: Option<PathBuf>,
        #[arg(long, default_value = "libx264")]
        video_codec: String,
        #[arg(long, default_value = "aac")]
        audio_codec: String,
    },
    /// Play a file immediately via ffplay
    Play {
        file: PathBuf,
        #[arg(long)]
        fullscreen: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Probe { file, json } => commands::probe::run(&cli.ffprobe_path, &file, json),
        Command::Remux { file, output_dir } => {
            commands::remux::run(&cli.ffmpeg_path, &file, output_dir)
        }
        Command::Transcode {
            file,
            output_dir,
            video_codec,
            audio_codec,
        } => commands::transcode::run(&cli.ffmpeg_path, &file, output_dir, &video_codec, &audio_codec),
        Command::Play { file, fullscreen } => commands::play::run(&cli.ffplay_path, &file, fullscreen),
    }
}
