use std::path::PathBuf;

use anyhow::{Context, Result};

/// Resolves a tool's path: an explicit CLI flag wins, otherwise fall back to
/// a PATH lookup by name.
pub fn resolve(explicit: &Option<PathBuf>, name: &str) -> Result<PathBuf> {
    if let Some(path) = explicit {
        return Ok(path.clone());
    }
    which::which(name).with_context(|| {
        format!(
            "could not find `{name}` on PATH - install it or pass --{name}-path explicitly"
        )
    })
}
