use crate::{
    database::{Database, song as song_repository, song_folder as repository},
    error::AppResult,
    models::{song::Song, song_folder::SongFolder},
};

/// 查询有歌曲的目录，可选按目录路径搜索。
pub fn list(db: &Database, keyword: Option<&str>) -> AppResult<Vec<SongFolder>> {
    let keyword = keyword.filter(|keyword| !keyword.trim().is_empty());

    db.with_conn(|connection| repository::find_all(connection, keyword))
}

/// 按目录查询全部歌曲。
pub fn songs(db: &Database, directory: &str) -> AppResult<Vec<Song>> {
    db.with_conn(|connection| song_repository::find_by_directory(connection, directory))
}
