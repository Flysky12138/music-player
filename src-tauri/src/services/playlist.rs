use crate::{
    database::{Database, playlist as repository},
    error::AppResult,
    models::playlist::PlaylistSnapshot,
};

/// 读取播放队列快照。
pub fn get(db: &Database) -> AppResult<PlaylistSnapshot> {
    db.with_conn(repository::find_snapshot)
}

/// 覆盖保存播放队列。
pub fn save(db: &Database, song_ids: &[i64], current_song_id: Option<i64>) -> AppResult<()> {
    db.with_conn(|connection| repository::replace(connection, song_ids, current_song_id))
}
