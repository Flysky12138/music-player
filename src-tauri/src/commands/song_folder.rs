use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::song::Song,
    models::song_folder::SongFolder, services::song_folder,
};

#[tauri::command]
pub async fn list_song_folders(
    db: State<'_, Db>,
    keyword: Option<String>,
) -> AppResult<Vec<SongFolder>> {
    let db = db.inner().clone();

    blocking(move || song_folder::list(&db, keyword.as_deref())).await
}

#[tauri::command]
pub async fn list_song_folder_songs(db: State<'_, Db>, path: String) -> AppResult<Vec<Song>> {
    let db = db.inner().clone();

    blocking(move || song_folder::songs(&db, &path)).await
}
