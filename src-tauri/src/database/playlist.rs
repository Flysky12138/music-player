use rusqlite::{Connection, OptionalExtension, params};

use crate::{
    database::song::{row_to_song, song_columns},
    error::AppResult,
    models::playlist::PlaylistSnapshot,
};

/// 查询播放队列，歌曲按队列顺序返回。已删除的歌曲由外键级联清理，不会出现在结果里。
pub fn find_snapshot(connection: &Connection) -> AppResult<PlaylistSnapshot> {
    let mut statement = connection.prepare(&format!(
        "SELECT {columns} FROM songs
         INNER JOIN playlist_items ON playlist_items.song_id = songs.id
         ORDER BY playlist_items.position",
        columns = song_columns("songs")
    ))?;

    let songs = statement
        .query_map([], row_to_song)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(PlaylistSnapshot {
        current_song_id: find_current_song_id(connection)?,
        songs,
    })
}

/// 整体覆盖播放队列。队列用一次事务写入，避免中途失败留下半截数据。
pub fn replace(
    connection: &Connection,
    song_ids: &[i64],
    current_song_id: Option<i64>,
) -> AppResult<()> {
    let transaction = connection.unchecked_transaction()?;

    transaction.execute("DELETE FROM playlist_items", [])?;

    {
        let mut statement = transaction
            .prepare("INSERT INTO playlist_items (position, song_id) VALUES (?1, ?2)")?;

        for (position, song_id) in song_ids.iter().enumerate() {
            statement.execute(params![position as i64, song_id])?;
        }
    }

    transaction.execute(
        "UPDATE player_state SET current_song_id = ?1 WHERE id = 1",
        params![current_song_id],
    )?;

    transaction.commit()?;

    Ok(())
}

fn find_current_song_id(connection: &Connection) -> AppResult<Option<i64>> {
    let current_song_id = connection
        .query_row(
            "SELECT current_song_id FROM player_state WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .optional()?
        .flatten();

    Ok(current_song_id)
}
