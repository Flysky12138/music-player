use std::path::{Path, PathBuf};

use crate::{
    database::{Database, music_folder as repository, song as song_repository},
    error::{AppError, AppResult},
    models::music_folder::MusicFolder,
    utils,
};

/// 校验并规范化用户选择的音乐目录。
fn validate_directory(path: &str) -> AppResult<PathBuf> {
    let path = Path::new(path);

    if !path.is_dir() {
        return Err(AppError::invalid_path(format!(
            "目录不存在：{}",
            path.display()
        )));
    }

    Ok(PathBuf::from(utils::normalize(path)?))
}

/// 添加音乐目录。
///
/// - 已存在相同目录或上级目录时直接复用，避免同一首歌被扫描两次；
/// - 新目录包含已有目录时，把子目录的记录合并到新目录下。
pub fn add(db: &Database, path: &str) -> AppResult<MusicFolder> {
    let directory = validate_directory(path)?;

    db.with_conn(|connection| {
        let transaction = connection.unchecked_transaction()?;
        let folder = add_within(&transaction, &directory)?;
        transaction.commit()?;

        Ok(folder)
    })
}

fn add_within(connection: &rusqlite::Connection, directory: &Path) -> AppResult<MusicFolder> {
    let folders = repository::find_all(connection)?;

    if let Some(existing) = folders
        .iter()
        .find(|folder| utils::is_same_or_descendant(Path::new(&folder.path), directory))
    {
        return Ok(existing.clone());
    }

    let folder = repository::create(connection, &directory.to_string_lossy())?;

    for child in folders
        .iter()
        .filter(|folder| utils::is_same_or_descendant(directory, Path::new(&folder.path)))
    {
        song_repository::reassign_folder(connection, child.id, folder.id)?;
        repository::delete(connection, child.id)?;
    }

    Ok(folder)
}

/// 查询全部音乐目录。
pub fn list(db: &Database) -> AppResult<Vec<MusicFolder>> {
    db.with_conn(repository::find_all)
}

/// 删除音乐目录。
pub fn remove(db: &Database, id: i64) -> AppResult<bool> {
    db.with_conn(|connection| repository::delete(connection, id))
}
