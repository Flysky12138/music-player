use std::path::Path;

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::error::{AppError, AppResult};

/// 在系统文件管理器中打开目录。
#[tauri::command]
pub fn open_directory(app: AppHandle, path: String) -> AppResult<()> {
    let path = Path::new(&path)
        .canonicalize()
        .map_err(|error| AppError::invalid_path(format!("无法打开目录 {path}：{error}")))?;

    if !path.is_dir() {
        return Err(AppError::invalid_path("目标路径不是目录"));
    }

    app.opener()
        .open_path(path.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|error| AppError::message(format!("调用系统文件管理器失败：{error}")))
}
