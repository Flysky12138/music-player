use tauri::{AppHandle, Manager, State};

use crate::{
    commands::blocking, database::Db, error::AppResult, models::scan::ScanSummary,
    services::scanner,
};

/// 扫描全部音乐目录，返回本次扫描的统计信息。
#[tauri::command]
pub async fn scan_library(app: AppHandle, db: State<'_, Db>) -> AppResult<ScanSummary> {
    let db = db.inner().clone();

    let cover_dir = app.path().app_data_dir()?.join("covers");

    blocking(move || scanner::scan(&db, &cover_dir)).await
}
