use serde::Serialize;

/// 音乐库统计结果，后续统计项统一扩展到此结构。
#[derive(Debug, Serialize)]
pub struct LibraryStatistics {
    pub play: PlayStatistics,
    pub quality: QualityStatistics,
}

/// 播放统计。只保留每日汇总，所以按天与按歌曲的聚合都在同一张表上完成。
#[derive(Debug, Serialize)]
pub struct PlayStatistics {
    /// 今日播放次数
    pub today: i64,
    /// 累计播放次数
    pub total: i64,
    /// 播放次数最多的歌曲
    pub top_songs: Vec<TopSong>,
    /// 近 7 天（含今天）播放次数
    pub week: i64,
}

/// 播放排行中的一首歌曲。
#[derive(Debug, Serialize)]
pub struct TopSong {
    pub artist: Vec<String>,
    pub cover_path: Option<String>,
    pub play_count: i64,
    pub song_id: i64,
    pub title: String,
}

/// 按音质等级统计的歌曲数量。
#[derive(Debug, Serialize)]
pub struct QualityStatistics {
    pub hq: i64,
    pub hr: i64,
    pub sq: i64,
    pub unknown: i64,
}
