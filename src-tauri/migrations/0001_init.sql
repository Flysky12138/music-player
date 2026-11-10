-- 扫描目录
CREATE TABLE
    IF NOT EXISTS music_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime ('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime ('now'))
    );

-- 歌曲
CREATE TABLE
    IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER REFERENCES music_folders (id) ON DELETE SET NULL,
        path TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        duration_ms INTEGER,
        track_number INTEGER,
        file_size INTEGER NOT NULL,
        file_modified_at INTEGER NOT NULL,
        cover_path TEXT,
        lyrics_path TEXT,
        bitrate INTEGER,
        sample_rate INTEGER,
        bit_depth INTEGER,
        channels INTEGER,
        quality TEXT,
        last_seen_scan_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime ('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime ('now'))
    );

CREATE INDEX IF NOT EXISTS idx_songs_title ON songs (title);

CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs (artist);

CREATE INDEX IF NOT EXISTS idx_songs_album ON songs (album);

CREATE INDEX IF NOT EXISTS idx_songs_folder_id ON songs (folder_id);

-- 播放队列。扫描清理掉歌曲时，对应队列项会被级联删除
CREATE TABLE IF NOT EXISTS playlist_items (
    position INTEGER PRIMARY KEY,
    song_id INTEGER NOT NULL REFERENCES songs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_song_id ON playlist_items (song_id);

-- 播放器状态，固定只有一行。存歌曲 id 而不是下标，避免删除歌曲后位置整体偏移
CREATE TABLE IF NOT EXISTS player_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_song_id INTEGER REFERENCES songs (id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO player_state (id) VALUES (1);

-- 每日播放次数汇总。按天聚合而不是记录每一次播放，避免数据无限膨胀
CREATE TABLE IF NOT EXISTS song_play_stats (
    song_id INTEGER NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    play_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (song_id, day)
);

CREATE INDEX IF NOT EXISTS idx_song_play_stats_day ON song_play_stats (day);
