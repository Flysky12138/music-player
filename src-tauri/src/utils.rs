use std::path::{Component, Path, PathBuf};

use crate::error::{AppError, AppResult};

/// 规范化路径并转换为可持久化的字符串（绝对路径、去掉 Windows 扩展长度前缀）。
///
/// 扫描目录、歌曲路径、音乐目录路径都必须走同一套规范化逻辑，否则会出现同一文件对应多条记录的问题。
pub fn normalize(path: &Path) -> AppResult<String> {
    let canonical = path.canonicalize().map_err(|error| {
        AppError::invalid_path(format!("无法解析路径 {}：{error}", path.display()))
    })?;

    Ok(to_storable_string(canonical))
}

/// 去掉 Windows 的 `\\?\`、`\\?\UNC\` 前缀。
fn to_storable_string(path: PathBuf) -> String {
    let text = path.to_string_lossy();

    #[cfg(windows)]
    {
        if let Some(rest) = text.strip_prefix(r"\\?\UNC\") {
            return format!(r"\\{rest}");
        }

        if let Some(rest) = text.strip_prefix(r"\\?\") {
            return rest.to_owned();
        }
    }

    text.into_owned()
}

/// 把关键词转成 `LIKE` 模式，并转义通配符，避免用户输入被当作模式匹配。
pub fn to_like_pattern(keyword: &str) -> String {
    let escaped = keyword
        .trim()
        .replace('\\', r"\\")
        .replace('%', r"\%")
        .replace('_', r"\_");

    format!("%{escaped}%")
}

/// `child` 是否与 `parent` 相同，或位于 `parent` 目录内部。
///
/// 按路径分段比较，避免 `D:\Music` 误匹配 `D:\Music2`；Windows 下忽略大小写。
pub fn is_same_or_descendant(parent: &Path, child: &Path) -> bool {
    let mut child_components = child.components();

    parent.components().all(|parent_component| {
        child_components
            .next()
            .is_some_and(|child_component| component_eq(&parent_component, &child_component))
    })
}

#[cfg(windows)]
fn component_eq(left: &Component<'_>, right: &Component<'_>) -> bool {
    left.as_os_str().eq_ignore_ascii_case(right.as_os_str())
}

#[cfg(not(windows))]
fn component_eq(left: &Component<'_>, right: &Component<'_>) -> bool {
    left == right
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::is_same_or_descendant;

    #[test]
    fn matches_same_path() {
        assert!(is_same_or_descendant(
            Path::new("/music"),
            Path::new("/music")
        ));
    }

    #[test]
    fn matches_nested_path() {
        assert!(is_same_or_descendant(
            Path::new("/music"),
            Path::new("/music/rock/song.flac")
        ));
    }

    #[test]
    fn ignores_sibling_with_shared_prefix() {
        assert!(!is_same_or_descendant(
            Path::new("/music"),
            Path::new("/music2/song.flac")
        ));
    }
}
