use serde::Serialize;

/// 艺术家列表项及其曲目汇总信息。
#[derive(Debug, Clone, Serialize)]
pub struct Artist {
    pub album_count: i64,
    pub cover_path: Option<String>,
    pub name: String,
    pub song_count: i64,
}
