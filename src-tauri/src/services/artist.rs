use crate::{
    database::{Database, artist as repository, song as song_repository},
    error::AppResult,
    models::artist::Artist,
    models::song::Song,
};

/// 查询艺术家，可选按艺术家名搜索。
pub fn list(db: &Database, keyword: Option<&str>) -> AppResult<Vec<Artist>> {
    let keyword = keyword.filter(|keyword| !keyword.trim().is_empty());

    db.with_conn(|connection| repository::find_all(connection, keyword))
}

/// 按完整艺术家名查询歌曲。
pub fn songs(db: &Database, name: &str) -> AppResult<Vec<Song>> {
    db.with_conn(|connection| song_repository::find_by_artist_name(connection, name))
}
