use serde::Serialize;

/// 专辑列表项及其曲目汇总信息。
#[derive(Debug, Clone, Serialize)]
pub struct Album {
    pub artist: Vec<String>,
    pub cover_path: Option<String>,
    pub duration_ms: i64,
    pub name: String,
    pub song_count: i64,
}
