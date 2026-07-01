use std::path::{Path, PathBuf};

use crate::error::CoreError;

/// A scratch directory for one remux/transcode job, identified by a random
/// id so concurrent jobs (or a CLI run alongside the desktop app) never
/// collide.
#[derive(Debug, Clone)]
pub struct Session {
    pub id: String,
    pub dir: PathBuf,
}

impl Session {
    /// Creates a new session directory under `base`. `base` is left entirely
    /// up to the caller - Tauri points it at the app's cache dir, the CLI at
    /// a `--work-dir` flag or the system temp dir.
    pub fn create(base: &Path) -> Result<Self, CoreError> {
        let id = uuid::Uuid::new_v4().to_string();
        let dir = base.join(&id);
        std::fs::create_dir_all(&dir)?;
        Ok(Self { id, dir })
    }
}
