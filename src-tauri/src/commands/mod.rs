pub mod album;
pub mod artist;
pub mod folder;
pub mod library;
pub mod playlist;
pub mod song;
pub mod song_folder;
pub mod statistics;
pub mod system;

use crate::error::{AppError, AppResult};

/// 在阻塞线程池中执行数据库 / 文件操作，避免卡住 UI 线程。
pub(crate) async fn blocking<T, F>(task: F) -> AppResult<T>
where
    F: FnOnce() -> AppResult<T> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|error| AppError::Runtime(format!("后台任务执行失败：{error}")))?
}
