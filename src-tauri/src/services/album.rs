use crate::{
    database::{Database, album as repository, song as song_repository},
    error::AppResult,
    models::album::Album,
    models::song::Song,
};

/// 查询专辑，可选按专辑名或艺术家搜索。
pub fn list(db: &Database, keyword: Option<&str>) -> AppResult<Vec<Album>> {
    let keyword = keyword.filter(|keyword| !keyword.trim().is_empty());

    db.with_conn(|connection| repository::find_all(connection, keyword))
}

/// 按完整专辑名查询全部歌曲。
pub fn songs(db: &Database, name: &str) -> AppResult<Vec<Song>> {
    db.with_conn(|connection| song_repository::find_by_album_name(connection, name))
}
