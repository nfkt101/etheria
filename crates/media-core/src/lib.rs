//! Shared, VLC-like media processing logic for Etheria: probing a file's
//! container/codecs, deciding whether a stream-copy remux or a full
//! transcode is needed, and building the ffmpeg/ffprobe invocations for
//! either. Deliberately has no opinion on *how* a process gets spawned
//! (Tauri sidecar, plain `std::process::Command`, whatever) - it only
//! builds args and parses output, so the same logic drives both the Tauri
//! desktop app and the standalone CLI.

pub mod codecs;
pub mod error;
pub mod probe;
pub mod progress;
pub mod remux;
pub mod session;
pub mod transcode;
pub mod types;

pub use codecs::is_remux_eligible;
pub use error::CoreError;
pub use progress::parse_ffmpeg_time_line;
pub use session::Session;
pub use types::{MediaProbe, ProgressEvent, StreamInfo};
