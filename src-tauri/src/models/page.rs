use serde::Serialize;

/// 分页查询结果。
#[derive(Debug, Serialize)]
pub struct Page<T> {
    /// 是否还有下一页
    pub has_more: bool,
    /// 当前页数据
    pub items: Vec<T>,
    /// 当前页码，从 1 开始
    pub page: i64,
    /// 每页条数
    pub page_size: i64,
    /// 符合条件的总条数
    pub total: i64,
}
