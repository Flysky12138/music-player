use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::playlist::PlaylistSnapshot,
    services::playlist,
};

#[tauri::command]
pub async fn get_playlist(db: State<'_, Db>) -> AppResult<PlaylistSnapshot> {
    let db = db.inner().clone();

    blocking(move || playlist::get(&db)).await
}

#[tauri::command]
pub async fn save_playlist(
    db: State<'_, Db>,
    song_ids: Vec<i64>,
    current_song_id: Option<i64>,
) -> AppResult<()> {
    let db = db.inner().clone();

    blocking(move || playlist::save(&db, &song_ids, current_song_id)).await
}
