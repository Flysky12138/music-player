mod audio;
mod commands;
mod database;
mod error;
mod models;
mod services;
mod utils;

use tauri::Manager;

use crate::database::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Debug
                } else {
                    log::LevelFilter::Info
                })
                .build(),
        )
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            let database = Database::open(&app_data_dir)?;

            // 运行时 scope 不会持久化，启动时重新授权已添加的音乐目录
            let folders = database.with_conn(database::music_folder::find_all)?;
            for folder in folders {
                commands::folder::allow_asset_directory(app.handle(), &folder.path);
            }

            app.manage(std::sync::Arc::new(database));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::open_directory,
            commands::album::list_albums,
            commands::album::list_album_songs,
            commands::artist::list_artists,
            commands::artist::list_artist_songs,
            commands::folder::list_music_folders,
            commands::folder::add_music_folder,
            commands::folder::remove_music_folder,
            commands::library::scan_library,
            commands::playlist::get_playlist,
            commands::playlist::save_playlist,
            commands::song::list_songs,
            commands::song::list_all_songs,
            commands::song_folder::list_song_folders,
            commands::song_folder::list_song_folder_songs,
            commands::statistics::get_library_statistics,
            commands::statistics::record_song_play,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
