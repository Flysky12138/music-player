use tauri::State;

use crate::{
    commands::blocking, database::Db, error::AppResult, models::page::Page, models::song::Song,
    services::song,
};

#[tauri::command]
pub async fn list_songs(
    db: State<'_, Db>,
    keyword: Option<String>,
    page: Option<i64>,
    page_size: Option<i64>,
) -> AppResult<Page<Song>> {
    let db = db.inner().clone();
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(50);

    blocking(move || song::list(&db, keyword.as_deref(), page, page_size)).await
}

#[tauri::command]
pub async fn list_all_songs(db: State<'_, Db>, keyword: Option<String>) -> AppResult<Vec<Song>> {
    let db = db.inner().clone();

    blocking(move || song::list_all(&db, keyword.as_deref())).await
}
