use rusqlite::{Connection, params};

use crate::{
    database::song::split_artists,
    error::AppResult,
    models::statistics::{LibraryStatistics, PlayStatistics, QualityStatistics, TopSong},
};

/// 播放排行展示的歌曲数量
const TOP_SONG_LIMIT: i64 = 10;

/// 查询音乐库统计数据。
pub fn find(connection: &Connection) -> AppResult<LibraryStatistics> {
    Ok(LibraryStatistics {
        play: find_play(connection)?,
        quality: find_quality(connection)?,
    })
}

/// 记录一次播放。歌曲已被删除时静默跳过，不当作错误。
pub fn record_play(connection: &Connection, song_id: i64) -> AppResult<()> {
    connection.execute(
        "INSERT INTO song_play_stats (song_id, day, play_count)
         SELECT ?1, date('now', 'localtime'), 1
         WHERE EXISTS (SELECT 1 FROM songs WHERE id = ?1)
         ON CONFLICT (song_id, day) DO UPDATE SET play_count = play_count + 1",
        params![song_id],
    )?;

    Ok(())
}

fn find_play(connection: &Connection) -> AppResult<PlayStatistics> {
    let (today, total, week) = connection.query_row(
        "SELECT
            COALESCE(SUM(CASE WHEN day = date('now', 'localtime') THEN play_count END), 0),
            COALESCE(SUM(play_count), 0),
            COALESCE(SUM(CASE WHEN day >= date('now', 'localtime', '-6 days') THEN play_count END), 0)
         FROM song_play_stats",
        [],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;

    let mut statement = connection.prepare(
        "SELECT
            songs.id,
            songs.title,
            songs.artist,
            songs.cover_path,
            SUM(stats.play_count) AS play_count
         FROM song_play_stats AS stats
         INNER JOIN songs ON songs.id = stats.song_id
         GROUP BY songs.id
         ORDER BY play_count DESC, songs.title COLLATE NOCASE
         LIMIT ?1",
    )?;

    let top_songs = statement
        .query_map(params![TOP_SONG_LIMIT], |row| {
            Ok(TopSong {
                artist: split_artists(row.get("artist")?),
                cover_path: row.get("cover_path")?,
                play_count: row.get("play_count")?,
                song_id: row.get("id")?,
                title: row.get("title")?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(PlayStatistics {
        today,
        top_songs,
        total,
        week,
    })
}

fn find_quality(connection: &Connection) -> AppResult<QualityStatistics> {
    let quality = connection.query_row(
        "SELECT
            COUNT(CASE WHEN quality = 'HQ' THEN 1 END),
            COUNT(CASE WHEN quality = 'HR' THEN 1 END),
            COUNT(CASE WHEN quality = 'SQ' THEN 1 END),
            COUNT(CASE WHEN quality IS NULL OR quality NOT IN ('HQ', 'HR', 'SQ') THEN 1 END)
         FROM songs",
        [],
        |row| {
            Ok(QualityStatistics {
                hq: row.get(0)?,
                hr: row.get(1)?,
                sq: row.get(2)?,
                unknown: row.get(3)?,
            })
        },
    )?;

    Ok(quality)
}
