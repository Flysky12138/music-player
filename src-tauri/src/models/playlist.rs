use serde::Serialize;

use crate::models::song::Song;

/// 播放队列快照。歌曲按队列顺序排列，已删除的歌曲不会出现在其中。
#[derive(Debug, Clone, Serialize)]
pub struct PlaylistSnapshot {
    pub current_song_id: Option<i64>,
    pub songs: Vec<Song>,
}
