use std::{
    fs,
    path::{Path, PathBuf},
};

use lofty::{
    picture::{MimeType, PictureType},
    prelude::*,
};

use crate::{
    audio,
    error::{AppError, AppResult},
};

/// 从音频文件里解析出的标签信息（不包含文件系统状态）。
#[derive(Debug, Default)]
pub struct TrackTags {
    pub album: Option<String>,
    pub artist: Option<String>,
    pub bit_depth: Option<i64>,
    pub bitrate: Option<i64>,
    pub channels: Option<i64>,
    pub cover_path: Option<String>,
    pub duration_ms: Option<i64>,
    pub quality: Option<String>,
    pub sample_rate: Option<i64>,
    pub title: String,
    pub track_number: Option<i64>,
}

/// 读取音频文件的标签、音频参数与封面。
pub fn read(path: &Path, cover_dir: &Path) -> AppResult<TrackTags> {
    let tagged_file = lofty::read_from_path(path)
        .map_err(|error| AppError::Metadata(format!("{}：{error}", path.display())))?;

    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag());
    let properties = tagged_file.properties();

    let title = tag
        .and_then(|tag| tag.title())
        .map(|title| title.trim().to_owned())
        .filter(|title| !title.is_empty())
        .unwrap_or_else(|| fallback_title(path));

    let sample_rate = properties.sample_rate().map(i64::from);
    let bit_depth = properties.bit_depth().map(i64::from);

    Ok(TrackTags {
        album: tag
            .and_then(|tag| tag.album())
            .map(|album| album.into_owned()),
        artist: tag
            .and_then(|tag| tag.artist())
            .map(|artist| artist.into_owned()),
        bit_depth,
        bitrate: properties.audio_bitrate().map(i64::from),
        channels: properties.channels().map(i64::from),
        cover_path: tag.and_then(|tag| save_cover(tag, cover_dir)),
        duration_ms: Some(properties.duration().as_millis() as i64),
        quality: audio::detect_quality(path, sample_rate, bit_depth),
        sample_rate,
        title,
        track_number: tag.and_then(|tag| tag.track()).map(i64::from),
    })
}

/// 查找与音频文件同名的歌词文件（`.lrc`，不区分大小写）。
pub fn find_lyrics(path: &Path) -> Option<PathBuf> {
    let directory = path.parent()?;
    let stem = path.file_stem()?.to_string_lossy();

    fs::read_dir(directory)
        .ok()?
        .flatten()
        .map(|entry| entry.path())
        .find(|candidate| {
            candidate.is_file()
                && candidate.file_stem().is_some_and(|candidate| {
                    candidate.to_string_lossy().eq_ignore_ascii_case(&stem)
                })
                && candidate
                    .extension()
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("lrc"))
        })
}

/// 文件名兜底标题（取文件名去掉扩展名）。
fn fallback_title(path: &Path) -> String {
    path.file_stem().map_or_else(
        || "未知标题".to_owned(),
        |name| name.to_string_lossy().into_owned(),
    )
}

/// 保存内嵌封面到缓存目录，返回封面路径。
///
/// 封面按内容哈希命名，相同图片只会保存一份；保存失败不影响歌曲入库。
fn save_cover(tag: &lofty::tag::Tag, cover_dir: &Path) -> Option<String> {
    let picture = tag
        .pictures()
        .iter()
        .find(|picture| picture.pic_type() == PictureType::CoverFront)
        .or_else(|| tag.pictures().first())?;

    let data = picture.data();
    let extension = picture
        .mime_type()
        .and_then(mime_extension)
        .unwrap_or_else(|| guess_extension(data));

    let cover_path = cover_dir.join(format!("{:016x}.{extension}", fnv1a(data)));

    if !cover_path.exists() {
        let saved = fs::create_dir_all(cover_dir).and_then(|()| fs::write(&cover_path, data));

        if let Err(error) = saved {
            log::warn!("封面保存失败（{}）：{error}", cover_path.display());

            return None;
        }
    }

    Some(cover_path.to_string_lossy().into_owned())
}

/// 图片 MIME 类型对应的扩展名。
fn mime_extension(mime: &MimeType) -> Option<&'static str> {
    match mime {
        MimeType::Bmp => Some("bmp"),
        MimeType::Gif => Some("gif"),
        MimeType::Jpeg => Some("jpg"),
        MimeType::Png => Some("png"),
        MimeType::Tiff => Some("tiff"),
        _ => None,
    }
}

/// 标签里缺少 MIME 时，通过文件头猜测图片格式。
fn guess_extension(data: &[u8]) -> &'static str {
    if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return "jpg";
    }

    if data.starts_with(b"\x89PNG\r\n\x1A\n") {
        return "png";
    }

    if data.starts_with(b"GIF8") {
        return "gif";
    }

    "jpg"
}

/// FNV-1a 哈希：跨进程、跨版本稳定，适合用作封面文件名。
fn fnv1a(data: &[u8]) -> u64 {
    const FNV_OFFSET_BASIS: u64 = 0xCBF2_9CE4_8422_2325;
    const FNV_PRIME: u64 = 0x0000_0100_0000_01B3;

    data.iter().fold(FNV_OFFSET_BASIS, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(FNV_PRIME)
    })
}
