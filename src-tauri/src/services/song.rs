use crate::{
    database::{Database, song as repository},
    error::AppResult,
    models::{page::Page, song::Song},
};

/// 每页最大条数，防止一次拉取过多数据
const MAX_PAGE_SIZE: i64 = 200;

/// 分页查询歌曲，可选按标题、艺术家或专辑关键词过滤。
pub fn list(
    db: &Database,
    keyword: Option<&str>,
    page: i64,
    page_size: i64,
) -> AppResult<Page<Song>> {
    let keyword = keyword.filter(|keyword| !keyword.trim().is_empty());
    let page = page.max(1);
    let page_size = page_size.clamp(1, MAX_PAGE_SIZE);
    let offset = (page - 1) * page_size;

    let (items, total) =
        db.with_conn(|connection| repository::find_page(connection, keyword, page_size, offset))?;

    Ok(Page {
        has_more: page * page_size < total,
        items,
        page,
        page_size,
        total,
    })
}

/// 查询全部歌曲，供「播放全部」这类需要完整列表的场景使用。
pub fn list_all(db: &Database, keyword: Option<&str>) -> AppResult<Vec<Song>> {
    let keyword = keyword.filter(|keyword| !keyword.trim().is_empty());

    db.with_conn(|connection| repository::find_all(connection, keyword))
}
