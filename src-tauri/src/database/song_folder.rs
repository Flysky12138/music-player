use rusqlite::{Connection, params};

use crate::{
    database::song::DIRECTORY_EXPR, error::AppResult, models::song_folder::SongFolder,
    utils::to_like_pattern,
};

/// 查询有歌曲的目录，可选按目录路径搜索。
pub fn find_all(connection: &Connection, keyword: Option<&str>) -> AppResult<Vec<SongFolder>> {
    let pattern = keyword.map(to_like_pattern);

    let mut statement = connection.prepare(&format!(
        "WITH grouped AS (
            SELECT
                {DIRECTORY_EXPR} AS directory,
                MIN(cover_path) AS cover_path,
                COUNT(*) AS song_count
            FROM songs
            GROUP BY directory
         )
         SELECT directory, cover_path, song_count
         FROM grouped
         WHERE ?1 IS NULL OR directory LIKE ?1 ESCAPE '\\'
         ORDER BY directory COLLATE NOCASE"
    ))?;

    let folders = statement
        .query_map(params![pattern], |row| {
            let directory: String = row.get("directory")?;

            Ok(SongFolder {
                cover_path: row.get("cover_path")?,
                name: folder_name(&directory),
                path: directory,
                song_count: row.get("song_count")?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(folders)
}

/// 取目录的最后一段作为展示名。
///
/// 不能直接用 `Path::file_name`：分组用的路径统一成了反斜杠（见 `DIRECTORY_EXPR`），
/// 而 `Path` 只认当前平台的分隔符，在 macOS / Linux 上整条路径会被当成一个文件名。
fn folder_name(directory: &str) -> String {
    directory
        .trim_end_matches(['/', '\\'])
        .rsplit(['/', '\\'])
        .next()
        .filter(|name| !name.is_empty())
        .unwrap_or(directory)
        .to_owned()
}
