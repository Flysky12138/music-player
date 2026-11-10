use serde::Serialize;

/// 一次音乐库扫描的结果统计。
#[derive(Debug, Default, Serialize)]
pub struct ScanSummary {
    /// 扫描的音乐目录数量
    pub folder_count: usize,
    /// 发现的音频文件数量
    pub discovered: usize,
    /// 处理失败的文件数量
    pub failed: usize,
    /// 成功入库的文件数量（含未变化的文件）
    pub indexed: usize,
    /// 清理掉的失效记录数量
    pub removed: usize,
    /// 文件未变化、直接跳过的数量
    pub unchanged: usize,
}
