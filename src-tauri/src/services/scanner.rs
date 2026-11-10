use std::{fs, path::Path, time::UNIX_EPOCH};

use rusqlite::Connection;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::{
    audio,
    database::{Database, music_folder as folder_repository, song as song_repository},
    error::AppResult,
    models::{scan::ScanSummary, song::NewSong},
    services::metadata,
    utils,
};

/// 单个文件的处理结果。
enum FileOutcome {
    /// 解析或读取失败
    Failed,
    /// 新建或更新入库
    Indexed,
    /// 文件未变化
    Unchanged,
}

/// 扫描全部音乐目录，增量同步数据库。
pub fn scan(db: &Database, cover_dir: &Path) -> AppResult<ScanSummary> {
    let scan_id = Uuid::new_v4().to_string();

    db.with_conn(|connection| {
        // 整个扫描共用一个事务，避免逐条提交造成的磁盘抖动
        let transaction = connection.unchecked_transaction()?;
        let summary = scan_with_connection(&transaction, cover_dir, &scan_id)?;
        transaction.commit()?;

        Ok(summary)
    })
}

fn scan_with_connection(
    connection: &Connection,
    cover_dir: &Path,
    scan_id: &str,
) -> AppResult<ScanSummary> {
    let folders = folder_repository::find_all(connection)?;

    let mut summary = ScanSummary {
        folder_count: folders.len(),
        ..Default::default()
    };

    // 目录遍历或文件读取出错时，不清理失效记录，避免误删
    let mut scan_complete = true;

    for folder in &folders {
        for entry in WalkDir::new(&folder.path) {
            let entry = match entry {
                Ok(entry) => entry,
                Err(error) => {
                    log::warn!("遍历目录失败（{}）：{error}", folder.path);
                    summary.failed += 1;
                    scan_complete = false;
                    continue;
                }
            };

            let path = entry.path();

            if !entry.file_type().is_file() || !audio::is_supported(path) {
                continue;
            }

            summary.discovered += 1;

            match index_file(connection, folder.id, path, cover_dir, scan_id)? {
                FileOutcome::Failed => summary.failed += 1,
                FileOutcome::Indexed => summary.indexed += 1,
                FileOutcome::Unchanged => {
                    summary.indexed += 1;
                    summary.unchanged += 1;
                }
            }
        }
    }

    if scan_complete {
        summary.removed = song_repository::delete_unseen(connection, scan_id)?;
    }

    Ok(summary)
}

/// 索引单个音频文件。
fn index_file(
    connection: &Connection,
    folder_id: i64,
    path: &Path,
    cover_dir: &Path,
    scan_id: &str,
) -> AppResult<FileOutcome> {
    let Ok(file_metadata) = fs::metadata(path) else {
        log::warn!("无法读取文件信息：{}", path.display());

        return Ok(FileOutcome::Failed);
    };

    let Some(modified_at) = file_metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
    else {
        log::warn!("无法读取文件修改时间：{}", path.display());

        return Ok(FileOutcome::Failed);
    };

    let file_size = file_metadata.len() as i64;
    let file_modified_at = modified_at.as_secs() as i64;

    let normalized_path = match utils::normalize(path) {
        Ok(normalized_path) => normalized_path,
        Err(error) => {
            log::warn!("{error}");

            return Ok(FileOutcome::Failed);
        }
    };

    let lyrics_path =
        metadata::find_lyrics(path).and_then(|lyrics| match utils::normalize(&lyrics) {
            Ok(lyrics_path) => Some(lyrics_path),
            Err(error) => {
                log::warn!("{error}");

                None
            }
        });

    let state = song_repository::find_file_state(connection, &normalized_path)?;

    let unchanged = state.as_ref().is_some_and(|state| {
        state.file_size == file_size
            && state.file_modified_at == file_modified_at
            && state.lyrics_path == lyrics_path
    });

    if unchanged {
        song_repository::mark_seen(connection, &normalized_path, folder_id, scan_id)?;

        return Ok(FileOutcome::Unchanged);
    }

    let tags = match metadata::read(path, cover_dir) {
        Ok(tags) => tags,
        Err(error) => {
            // 标签损坏时保留旧记录，避免下次扫描把歌曲删掉
            if state.is_some() {
                song_repository::mark_seen(connection, &normalized_path, folder_id, scan_id)?;
            }

            log::warn!("已跳过该文件：{error}");

            return Ok(FileOutcome::Failed);
        }
    };

    let song = NewSong {
        album: tags.album,
        artist: tags.artist,
        bit_depth: tags.bit_depth,
        bitrate: tags.bitrate,
        channels: tags.channels,
        cover_path: tags.cover_path,
        duration_ms: tags.duration_ms,
        file_modified_at,
        file_size,
        folder_id,
        lyrics_path,
        path: normalized_path,
        quality: tags.quality,
        sample_rate: tags.sample_rate,
        title: tags.title,
        track_number: tags.track_number,
    };

    song_repository::upsert(connection, &song, scan_id)?;

    Ok(FileOutcome::Indexed)
}
