use rusqlite::{Connection, OptionalExtension, Row, params};

use crate::{
    error::{AppError, AppResult},
    models::music_folder::MusicFolder,
};

const FOLDER_COLUMNS: &str = "id, path, created_at, updated_at";

fn row_to_folder(row: &Row<'_>) -> rusqlite::Result<MusicFolder> {
    Ok(MusicFolder {
        created_at: row.get("created_at")?,
        id: row.get("id")?,
        path: row.get("path")?,
        updated_at: row.get("updated_at")?,
    })
}

/// 新增音乐目录。
pub fn create(connection: &Connection, path: &str) -> AppResult<MusicFolder> {
    connection
        .execute(
            "INSERT INTO music_folders (path) VALUES (?1)",
            params![path],
        )
        .map_err(map_constraint_error)?;

    let id = connection.last_insert_rowid();

    find_by_id(connection, id)?.ok_or_else(|| AppError::message("新增的目录无法读取，请重试"))
}

/// 按主键查询音乐目录。
pub fn find_by_id(connection: &Connection, id: i64) -> AppResult<Option<MusicFolder>> {
    let folder = connection
        .query_row(
            &format!("SELECT {FOLDER_COLUMNS} FROM music_folders WHERE id = ?1"),
            params![id],
            row_to_folder,
        )
        .optional()?;

    Ok(folder)
}

/// 查询全部音乐目录，按添加顺序排列。
pub fn find_all(connection: &Connection) -> AppResult<Vec<MusicFolder>> {
    let mut statement = connection.prepare(&format!(
        "SELECT {FOLDER_COLUMNS} FROM music_folders ORDER BY id"
    ))?;

    let folders = statement
        .query_map([], row_to_folder)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(folders)
}

/// 删除音乐目录，歌曲记录会保留到下一次扫描清理。
pub fn delete(connection: &Connection, id: i64) -> AppResult<bool> {
    let affected = connection.execute("DELETE FROM music_folders WHERE id = ?1", params![id])?;

    Ok(affected > 0)
}

/// 把唯一约束冲突转换成可读的业务错误。
fn map_constraint_error(error: rusqlite::Error) -> AppError {
    match &error {
        rusqlite::Error::SqliteFailure(inner, _)
            if inner.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            AppError::message("该目录已在列表中")
        }
        _ => AppError::from(error),
    }
}
