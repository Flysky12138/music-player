use rusqlite::{Connection, params};

use crate::{error::AppResult, models::artist::Artist, utils::to_like_pattern};

/// 查询艺术家，可选按艺术家名搜索。
pub fn find_all(connection: &Connection, keyword: Option<&str>) -> AppResult<Vec<Artist>> {
    let pattern = keyword.map(to_like_pattern);
    let mut statement = connection.prepare(
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
         ),
         artist_songs AS (
            SELECT DISTINCT split_artists.song_id, split_artists.name, songs.album, songs.cover_path
            FROM split_artists
            JOIN songs ON songs.id = split_artists.song_id
            WHERE split_artists.name <> ''
         )
         SELECT
            name,
            MIN(cover_path) AS cover_path,
            COUNT(DISTINCT song_id) AS song_count,
            COUNT(DISTINCT NULLIF(trim(album), '')) AS album_count
         FROM artist_songs
         WHERE ?1 IS NULL OR name LIKE ?1 ESCAPE '\\'
         GROUP BY name
         ORDER BY name COLLATE NOCASE",
    )?;

    let artists = statement
        .query_map(params![pattern], |row| {
            Ok(Artist {
                album_count: row.get("album_count")?,
                cover_path: row.get("cover_path")?,
                name: row.get("name")?,
                song_count: row.get("song_count")?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(artists)
}
