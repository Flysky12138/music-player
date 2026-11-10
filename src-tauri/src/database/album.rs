use rusqlite::{Connection, params};

use crate::{error::AppResult, models::album::Album, utils::to_like_pattern};

/// 查询专辑，可选按专辑名或艺术家搜索。
pub fn find_all(connection: &Connection, keyword: Option<&str>) -> AppResult<Vec<Album>> {
    let pattern = keyword.map(to_like_pattern);
    let mut statement = connection.prepare(
        "WITH RECURSIVE split_artists(album_name, remaining, artist_name) AS (
            SELECT trim(album), artist || ',', NULL
            FROM songs
            WHERE album IS NOT NULL
                AND trim(album) <> ''
                AND artist IS NOT NULL

            UNION ALL

            SELECT
                album_name,
                substr(remaining, instr(remaining, ',') + 1),
                trim(substr(remaining, 1, instr(remaining, ',') - 1))
            FROM split_artists
            WHERE remaining <> ''
         ),
         album_artists AS (
            SELECT DISTINCT album_name, artist_name
            FROM split_artists
            WHERE artist_name <> ''
         ),
         album_summary AS (
            SELECT
                trim(album) AS name,
                MIN(cover_path) AS cover_path,
                COALESCE(SUM(duration_ms), 0) AS duration_ms,
                COUNT(*) AS song_count
            FROM songs
            WHERE album IS NOT NULL
                AND trim(album) <> ''
            GROUP BY trim(album)
         )
         SELECT
            album_summary.name,
            (
                SELECT group_concat(artist_name, ', ')
                FROM (
                    SELECT artist_name
                    FROM album_artists
                    WHERE album_name = album_summary.name
                    ORDER BY artist_name COLLATE NOCASE
                )
            ) AS artist,
            album_summary.cover_path,
            album_summary.duration_ms,
            album_summary.song_count
         FROM album_summary
         WHERE ?1 IS NULL
            OR album_summary.name LIKE ?1 ESCAPE '\\'
            OR EXISTS (
                SELECT 1
                FROM album_artists
                WHERE album_name = album_summary.name
                    AND artist_name LIKE ?1 ESCAPE '\\'
            )
         ORDER BY album_summary.name COLLATE NOCASE",
    )?;

    let albums = statement
        .query_map(params![pattern], |row| {
            let artist: Option<String> = row.get("artist")?;

            Ok(Album {
                artist: artist
                    .unwrap_or_default()
                    .split(',')
                    .map(str::trim)
                    .filter(|artist| !artist.is_empty())
                    .map(str::to_owned)
                    .collect(),
                cover_path: row.get("cover_path")?,
                duration_ms: row.get("duration_ms")?,
                name: row.get("name")?,
                song_count: row.get("song_count")?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(albums)
}
