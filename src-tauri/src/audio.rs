use std::path::Path;

/// 支持扫描的音频扩展名（小写）。
///
/// 扫描阶段就按平台过滤，避免把 WebView 解码不了的格式写进音乐库。
/// 各平台 WebView 内核的解码能力不同：
/// - `ape` / `wv` / `mpc` / `spx`：Chromium 与 WebKit 都不支持，任何平台都不收录；
/// - `ogg` / `opus`：Chromium 支持，macOS 的 WKWebView 不支持。
#[cfg(target_os = "macos")]
const SUPPORTED_EXTENSIONS: &[&str] = &["aac", "aif", "aiff", "flac", "m4a", "mp3", "wav"];

#[cfg(not(target_os = "macos"))]
const SUPPORTED_EXTENSIONS: &[&str] = &[
    "aac", "aif", "aiff", "flac", "m4a", "mp3", "ogg", "opus", "wav",
];

/// 无损格式，用于划分音质等级。
const LOSSLESS_EXTENSIONS: &[&str] = &["aif", "aiff", "flac", "wav"];

/// 音质等级（写入数据库的字符串）。
pub mod quality {
    /// 高解析（采样率 > 44.1kHz 或位深 > 16bit 的无损）
    pub const HI_RES: &str = "HR";
    /// 有损压缩
    pub const LOSSY: &str = "HQ";
    /// CD 级无损
    pub const LOSSLESS: &str = "SQ";
}

/// 取小写扩展名。
fn extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(str::to_ascii_lowercase)
}

/// 是否为支持的音频文件。
pub fn is_supported(path: &Path) -> bool {
    extension(path).is_some_and(|extension| SUPPORTED_EXTENSIONS.contains(&extension.as_str()))
}

/// 根据扩展名与音频参数推断音质等级。
pub fn detect_quality(
    path: &Path,
    sample_rate: Option<i64>,
    bit_depth: Option<i64>,
) -> Option<String> {
    let extension = extension(path)?;

    if !LOSSLESS_EXTENSIONS.contains(&extension.as_str()) {
        return Some(quality::LOSSY.to_owned());
    }

    let is_hi_res =
        sample_rate.is_some_and(|rate| rate > 44_100) || bit_depth.is_some_and(|depth| depth > 16);

    Some(
        if is_hi_res {
            quality::HI_RES
        } else {
            quality::LOSSLESS
        }
        .to_owned(),
    )
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::{detect_quality, is_supported, quality};

    #[test]
    fn recognizes_supported_extensions_case_insensitively() {
        assert!(is_supported(Path::new("song.MP3")));
        assert!(is_supported(Path::new("song.flac")));
        assert!(!is_supported(Path::new("cover.jpg")));
    }

    #[test]
    fn skips_formats_webview_cannot_decode() {
        // 所有平台的 WebView 都不支持这三种
        assert!(!is_supported(Path::new("song.ape")));
        assert!(!is_supported(Path::new("song.wv")));
        assert!(!is_supported(Path::new("song.mpc")));

        // Ogg 容器：Chromium 支持，WKWebView 不支持
        assert_eq!(
            is_supported(Path::new("song.ogg")),
            !cfg!(target_os = "macos")
        );
        assert_eq!(
            is_supported(Path::new("song.opus")),
            !cfg!(target_os = "macos")
        );
    }

    #[test]
    fn detects_quality_levels() {
        assert_eq!(
            detect_quality(Path::new("song.mp3"), Some(44_100), Some(16)).as_deref(),
            Some(quality::LOSSY)
        );
        assert_eq!(
            detect_quality(Path::new("song.flac"), Some(44_100), Some(16)).as_deref(),
            Some(quality::LOSSLESS)
        );
        assert_eq!(
            detect_quality(Path::new("song.flac"), Some(96_000), Some(24)).as_deref(),
            Some(quality::HI_RES)
        );
    }
}
