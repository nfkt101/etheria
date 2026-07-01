mod media;

use media::state::MediaState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(MediaState::default())
        .invoke_handler(tauri::generate_handler![
            media::probe::probe_media,
            media::remux::remux_to_mp4,
            media::transcode::transcode_to_hls,
            media::transcode::cancel_processing,
            media::transcode::cleanup_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
