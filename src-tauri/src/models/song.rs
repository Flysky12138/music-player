use serde::Serialize;

/// 已入库的歌曲。
#[derive(Debug, Clone, Serialize)]
pub struct Song {
    pub album: Option<String>,
    pub artist: Vec<String>,
    pub bit_depth: Option<i64>,
    pub bitrate: Option<i64>,
    pub channels: Option<i64>,
    pub cover_path: Option<String>,
    pub created_at: String,
    /// 时长（毫秒）
    pub duration_ms: Option<i64>,
    /// 文件最后修改时间（Unix 秒），用于增量扫描
    pub file_modified_at: i64,
    /// 文件大小（字节），用于增量扫描
    pub file_size: i64,
    pub folder_id: Option<i64>,
    pub id: i64,
    /// 歌词文件路径
    pub lyrics_path: Option<String>,
    pub path: String,
    pub quality: Option<String>,
    pub sample_rate: Option<i64>,
    pub title: String,
    pub track_number: Option<i64>,
    pub updated_at: String,
}

/// 待写入数据库的歌曲，由扫描流程组装。
#[derive(Debug)]
pub struct NewSong {
    pub album: Option<String>,
    pub artist: Option<String>,
    pub bit_depth: Option<i64>,
    pub bitrate: Option<i64>,
    pub channels: Option<i64>,
    pub cover_path: Option<String>,
    pub duration_ms: Option<i64>,
    pub file_modified_at: i64,
    pub file_size: i64,
    pub folder_id: i64,
    pub lyrics_path: Option<String>,
    pub path: String,
    pub quality: Option<String>,
    pub sample_rate: Option<i64>,
    pub title: String,
    pub track_number: Option<i64>,
}

/// 增量扫描时用于判断文件是否变化的最小信息。
#[derive(Debug)]
pub struct SongFileState {
    pub file_modified_at: i64,
    pub file_size: i64,
    pub lyrics_path: Option<String>,
}
