use std::{
    fs,
    path::Path,
    sync::{Arc, Mutex},
};

use rusqlite::Connection;

use crate::error::{AppError, AppResult};

const DATABASE_FILE_NAME: &str = "music.db";

/// 数据库迁移脚本，必须按版本号递增排列。
const MIGRATIONS: &[(u32, &str)] = &[(1, include_str!("../../migrations/0001_init.sql"))];

/// 全局共享的数据库句柄。
///
/// 通过 [`Database::with_conn`] 统一加锁，避免把 `Mutex` 暴露给上层。
pub struct Database {
    connection: Mutex<Connection>,
}

/// 便于在命令层与后台任务之间共享的数据库句柄。
pub type Db = Arc<Database>;

impl Database {
    /// 打开（必要时创建）数据库并执行迁移。
    pub fn open(app_data_dir: &Path) -> AppResult<Self> {
        fs::create_dir_all(app_data_dir)?;

        let mut connection = Connection::open(app_data_dir.join(DATABASE_FILE_NAME))?;

        connection.execute_batch("PRAGMA foreign_keys = ON;")?;

        migrate(&mut connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    /// 独占访问数据库连接。
    pub fn with_conn<T>(&self, action: impl FnOnce(&Connection) -> AppResult<T>) -> AppResult<T> {
        let connection = self.connection.lock().map_err(|_| AppError::Locked)?;

        action(&connection)
    }
}

/// 依次执行尚未应用的迁移。
fn migrate(connection: &mut Connection) -> AppResult<()> {
    let current_version: u32 = connection.query_row("PRAGMA user_version", [], |row| row.get(0))?;

    for (version, sql) in MIGRATIONS
        .iter()
        .filter(|(version, _)| *version > current_version)
    {
        let transaction = connection.transaction()?;

        transaction.execute_batch(sql)?;
        transaction.execute_batch(&format!("PRAGMA user_version = {version};"))?;

        transaction.commit()?;

        log::info!("已应用数据库迁移 v{version}");
    }

    Ok(())
}
