use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct MusicFolder {
    pub id: i64,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
}
