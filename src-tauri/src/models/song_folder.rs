use serde::Serialize;

/// 歌曲所在的目录及其曲目汇总信息。
#[derive(Debug, Clone, Serialize)]
pub struct SongFolder {
    pub cover_path: Option<String>,
    /// 目录名，用于展示
    pub name: String,
    /// 目录路径，作为唯一标识
    pub path: String,
    pub song_count: i64,
}
