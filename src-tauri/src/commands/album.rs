use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::album::Album, services::album,
};

#[tauri::command]
pub async fn list_albums(db: State<'_, Db>, keyword: Option<String>) -> AppResult<Vec<Album>> {
    let db = db.inner().clone();

    blocking(move || album::list(&db, keyword.as_deref())).await
}

#[tauri::command]
pub async fn list_album_songs(
    db: State<'_, Db>,
    name: String,
) -> AppResult<Vec<crate::models::song::Song>> {
    let db = db.inner().clone();

    blocking(move || album::songs(&db, &name)).await
}
