use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::artist::Artist, services::artist,
};

#[tauri::command]
pub async fn list_artists(db: State<'_, Db>, keyword: Option<String>) -> AppResult<Vec<Artist>> {
    let db = db.inner().clone();

    blocking(move || artist::list(&db, keyword.as_deref())).await
}

#[tauri::command]
pub async fn list_artist_songs(
    db: State<'_, Db>,
    name: String,
) -> AppResult<Vec<crate::models::song::Song>> {
    let db = db.inner().clone();

    blocking(move || artist::songs(&db, &name)).await
}
