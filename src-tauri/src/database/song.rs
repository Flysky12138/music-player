use rusqlite::{Connection, OptionalExtension, Row, params};

use crate::{
    error::AppResult,
    models::song::{NewSong, Song, SongFileState},
    utils::to_like_pattern,
};

const SONG_COLUMNS: &str = "id, folder_id, path, title, artist, album, duration_ms, track_number, \
     file_size, file_modified_at, cover_path, lyrics_path, bitrate, sample_rate, bit_depth, \
     channels, quality, created_at, updated_at";

/// 带表别名的列清单，JOIN 查询时用，避免列名歧义。
pub(crate) fn song_columns(alias: &str) -> String {
    SONG_COLUMNS
        .split(',')
        .map(|column| format!("{alias}.{column}", column = column.trim()))
        .collect::<Vec<_>>()
        .join(", ")
}

/// 歌曲所在目录的 SQL 表达式：先把 `/` 统一成 `\`，再从右侧去掉所有非分隔符字符，
/// 剩下的正好是截断到最后一个分隔符（含）的前缀，即歌曲所在目录。
pub(crate) const DIRECTORY_EXPR: &str =
    r"rtrim(replace(path, '/', '\'), replace(replace(path, '/', '\'), '\', ''))";

/// 元数据里的艺术家是逗号分隔的字符串，拆分并去掉空白项。
pub(crate) fn split_artists(value: Option<String>) -> Vec<String> {
    value
        .unwrap_or_default()
        .split(',')
        .map(str::trim)
        .filter(|artist| !artist.is_empty())
        .map(str::to_owned)
        .collect()
}

pub(crate) fn row_to_song(row: &Row<'_>) -> rusqlite::Result<Song> {
    Ok(Song {
        album: row.get("album")?,
        artist: split_artists(row.get("artist")?),
        bit_depth: row.get("bit_depth")?,
        bitrate: row.get("bitrate")?,
        channels: row.get("channels")?,
        cover_path: row.get("cover_path")?,
        created_at: row.get("created_at")?,
        duration_ms: row.get("duration_ms")?,
        file_modified_at: row.get("file_modified_at")?,
        file_size: row.get("file_size")?,
        folder_id: row.get("folder_id")?,
        id: row.get("id")?,
        lyrics_path: row.get("lyrics_path")?,
        path: row.get("path")?,
        quality: row.get("quality")?,
        sample_rate: row.get("sample_rate")?,
        title: row.get("title")?,
        track_number: row.get("track_number")?,
        updated_at: row.get("updated_at")?,
    })
}

/// 标题、艺术家、专辑的关键词过滤条件，`?1` 为空时不过滤。
const KEYWORD_FILTER: &str = "?1 IS NULL
            OR title LIKE ?1 ESCAPE '\\'
            OR artist LIKE ?1 ESCAPE '\\'
            OR album LIKE ?1 ESCAPE '\\'";

/// 分页查询歌曲，最近入库的排在前面。
///
/// 可选按标题、艺术家、专辑关键词过滤；同时返回符合条件的总条数，便于前端计算页数。
pub fn find_page(
    connection: &Connection,
    keyword: Option<&str>,
    limit: i64,
    offset: i64,
) -> AppResult<(Vec<Song>, i64)> {
    let pattern = keyword.map(to_like_pattern);

    let total = connection.query_row(
        &format!("SELECT COUNT(*) FROM songs WHERE {KEYWORD_FILTER}"),
        params![pattern],
        |row| row.get(0),
    )?;

    let mut statement = connection.prepare(&format!(
        "SELECT {SONG_COLUMNS} FROM songs
         WHERE {KEYWORD_FILTER}
         ORDER BY id DESC
         LIMIT ?2 OFFSET ?3"
    ))?;

    let songs = statement
        .query_map(params![pattern, limit, offset], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok((songs, total))
}

/// 查询全部歌曲（不分页），最近入库的排在前面。
pub fn find_all(connection: &Connection, keyword: Option<&str>) -> AppResult<Vec<Song>> {
    let pattern = keyword.map(to_like_pattern);

    let mut statement = connection.prepare(&format!(
        "SELECT {SONG_COLUMNS} FROM songs
         WHERE {KEYWORD_FILTER}
         ORDER BY id DESC"
    ))?;

    let songs = statement
        .query_map(params![pattern], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(songs)
}

/// 按完整专辑名查询全部歌曲。
pub fn find_by_album_name(connection: &Connection, name: &str) -> AppResult<Vec<Song>> {
    let mut statement = connection.prepare(&format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE album IS NOT NULL AND trim(album) = trim(?1) \
         ORDER BY track_number, title COLLATE NOCASE, id"
    ))?;

    let songs = statement
        .query_map(params![name], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(songs)
}

/// 按所在目录查询全部歌曲。目录需与 `DIRECTORY_EXPR` 的结果一致（含结尾分隔符）。
pub fn find_by_directory(connection: &Connection, directory: &str) -> AppResult<Vec<Song>> {
    let mut statement = connection.prepare(&format!(
        "SELECT {SONG_COLUMNS} FROM songs \
         WHERE {DIRECTORY_EXPR} = ?1 \
         ORDER BY path COLLATE NOCASE"
    ))?;

    let songs = statement
        .query_map(params![directory], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(songs)
}

/// 按完整艺术家名查询歌曲，支持歌曲元数据中的逗号分隔艺术家列表。
pub fn find_by_artist_name(connection: &Connection, name: &str) -> AppResult<Vec<Song>> {
    let mut statement = connection.prepare(&format!(
        "WITH RECURSIVE split_artists(song_id, remaining, name) AS (
            SELECT id, artist || ',', NULL
            FROM songs
            WHERE artist IS NOT NULL

            UNION ALL

            SELECT
                song_id,
                substr(remaining, instr(remaining, ',') + 1),
                trim(substr(remaining, 1, instr(remaining, ',') - 1))
            FROM split_artists
            WHERE remaining <> ''
         )
         SELECT {SONG_COLUMNS}
         FROM songs
         WHERE id IN (
            SELECT song_id
            FROM split_artists
            WHERE name = trim(?1)
         )
         ORDER BY track_number, title COLLATE NOCASE, id"
    ))?;

    let songs = statement
        .query_map(params![name], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(songs)
}

/// 按文件路径查询增量扫描所需的信息。
pub fn find_file_state(connection: &Connection, path: &str) -> AppResult<Option<SongFileState>> {
    let state = connection
        .query_row(
            "SELECT file_size, file_modified_at, lyrics_path FROM songs WHERE path = ?1",
            params![path],
            |row| {
                Ok(SongFileState {
                    file_modified_at: row.get("file_modified_at")?,
                    file_size: row.get("file_size")?,
                    lyrics_path: row.get("lyrics_path")?,
                })
            },
        )
        .optional()?;

    Ok(state)
}

/// 新增或更新歌曲（以文件路径为唯一键）。
pub fn upsert(connection: &Connection, song: &NewSong, scan_id: &str) -> AppResult<()> {
    connection.execute(
        "INSERT INTO songs (
            folder_id, path, title, artist, album,
            duration_ms, track_number, file_size, file_modified_at,
            cover_path, lyrics_path, bitrate, sample_rate, bit_depth,
            channels, quality, last_seen_scan_id
         ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17
         )
         ON CONFLICT(path) DO UPDATE SET
            folder_id = excluded.folder_id,
            title = excluded.title,
            artist = excluded.artist,
            album = excluded.album,
            duration_ms = excluded.duration_ms,
            track_number = excluded.track_number,
            file_size = excluded.file_size,
            file_modified_at = excluded.file_modified_at,
            cover_path = excluded.cover_path,
            lyrics_path = excluded.lyrics_path,
            bitrate = excluded.bitrate,
            sample_rate = excluded.sample_rate,
            bit_depth = excluded.bit_depth,
            channels = excluded.channels,
            quality = excluded.quality,
            last_seen_scan_id = excluded.last_seen_scan_id,
            updated_at = datetime('now')",
        params![
            song.folder_id,
            song.path,
            song.title,
            song.artist,
            song.album,
            song.duration_ms,
            song.track_number,
            song.file_size,
            song.file_modified_at,
            song.cover_path,
            song.lyrics_path,
            song.bitrate,
            song.sample_rate,
            song.bit_depth,
            song.channels,
            song.quality,
            scan_id,
        ],
    )?;

    Ok(())
}

/// 标记歌曲在本次扫描中出现过。
pub fn mark_seen(
    connection: &Connection,
    path: &str,
    folder_id: i64,
    scan_id: &str,
) -> AppResult<()> {
    connection.execute(
        "UPDATE songs
         SET folder_id = ?1, last_seen_scan_id = ?2
         WHERE path = ?3",
        params![folder_id, scan_id, path],
    )?;

    Ok(())
}

/// 删除本次扫描中未出现的歌曲，返回删除数量。
pub fn delete_unseen(connection: &Connection, scan_id: &str) -> AppResult<usize> {
    let removed = connection.execute(
        "DELETE FROM songs
         WHERE last_seen_scan_id IS NULL OR last_seen_scan_id <> ?1",
        params![scan_id],
    )?;

    Ok(removed)
}

/// 把某个目录下的歌曲迁移到另一个目录（合并目录时使用）。
pub fn reassign_folder(
    connection: &Connection,
    from_folder_id: i64,
    to_folder_id: i64,
) -> AppResult<usize> {
    let moved = connection.execute(
        "UPDATE songs
         SET folder_id = ?1, updated_at = datetime('now')
         WHERE folder_id = ?2",
        params![to_folder_id, from_folder_id],
    )?;

    Ok(moved)
}
