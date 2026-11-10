use crate::{
    database::{Database, statistics as repository},
    error::AppResult,
    models::statistics::LibraryStatistics,
};

/// 查询音乐库统计数据。
pub fn get(db: &Database) -> AppResult<LibraryStatistics> {
    db.with_conn(repository::find)
}

/// 记录一次歌曲播放。
pub fn record_play(db: &Database, song_id: i64) -> AppResult<()> {
    db.with_conn(|connection| repository::record_play(connection, song_id))
}
