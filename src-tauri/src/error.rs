use std::fmt;

/// 应用统一错误类型。
///
/// 命令层统一返回 [`AppResult`]，序列化给前端时只保留可读的错误信息，
/// 避免把底层错误结构暴露出去。
#[derive(Debug)]
pub enum AppError {
    /// 数据库访问失败
    Database(rusqlite::Error),
    /// 路径非法或不存在
    InvalidPath(String),
    /// 文件系统操作失败
    Io(std::io::Error),
    /// 数据库连接被其他线程中断
    Locked,
    /// 音频元数据解析失败
    Metadata(String),
    /// 业务错误
    Message(String),
    /// 后台任务或运行时错误
    Runtime(String),
    /// Tauri 运行时错误
    Tauri(tauri::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn invalid_path(message: impl Into<String>) -> Self {
        Self::InvalidPath(message.into())
    }

    pub fn message(message: impl Into<String>) -> Self {
        Self::Message(message.into())
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Database(error) => write!(formatter, "数据库操作失败：{error}"),
            Self::InvalidPath(message) => write!(formatter, "{message}"),
            Self::Io(error) => write!(formatter, "文件操作失败：{error}"),
            Self::Locked => write!(formatter, "数据库连接被意外中断，请重启应用"),
            Self::Metadata(message) => write!(formatter, "音频信息解析失败：{message}"),
            Self::Message(message) => write!(formatter, "{message}"),
            Self::Runtime(message) => write!(formatter, "运行出错：{message}"),
            Self::Tauri(error) => write!(formatter, "Tauri 错误：{error}"),
        }
    }
}

impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Database(error) => Some(error),
            Self::Io(error) => Some(error),
            Self::Tauri(error) => Some(error),
            _ => None,
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error)
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<tauri::Error> for AppError {
    fn from(error: tauri::Error) -> Self {
        Self::Tauri(error)
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
