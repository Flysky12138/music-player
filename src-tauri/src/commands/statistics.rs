use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::statistics::LibraryStatistics,
    services::statistics,
};

#[tauri::command]
pub async fn get_library_statistics(db: State<'_, Db>) -> AppResult<LibraryStatistics> {
    let db = db.inner().clone();

    blocking(move || statistics::get(&db)).await
}

#[tauri::command]
pub async fn record_song_play(db: State<'_, Db>, song_id: i64) -> AppResult<()> {
    let db = db.inner().clone();

    blocking(move || statistics::record_play(&db, song_id)).await
}
