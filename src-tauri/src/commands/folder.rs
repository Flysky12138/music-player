use tauri::{AppHandle, Manager, State};

use crate::{
    commands::blocking, database::Db, error::AppResult, models::music_folder::MusicFolder,
    services::music_folder,
};

/// 允许 WebView 通过 asset 协议读取该目录，播放歌曲、显示封面都需要。
pub fn allow_asset_directory(app: &AppHandle, path: &str) {
    if let Err(error) = app.asset_protocol_scope().allow_directory(path, true) {
        log::warn!("无法授权目录（{path}）：{error}");
    }
}

#[tauri::command]
pub async fn list_music_folders(db: State<'_, Db>) -> AppResult<Vec<MusicFolder>> {
    let db = db.inner().clone();

    blocking(move || music_folder::list(&db)).await
}

#[tauri::command]
pub async fn add_music_folder(
    app: AppHandle,
    db: State<'_, Db>,
    path: String,
) -> AppResult<MusicFolder> {
    let db = db.inner().clone();
    let folder = blocking(move || music_folder::add(&db, &path)).await?;

    allow_asset_directory(&app, &folder.path);

    Ok(folder)
}

#[tauri::command]
pub async fn remove_music_folder(db: State<'_, Db>, id: i64) -> AppResult<bool> {
    let db = db.inner().clone();

    blocking(move || music_folder::remove(&db, id)).await
}
