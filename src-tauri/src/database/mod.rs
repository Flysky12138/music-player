mod connection;

pub mod album;
pub mod artist;
pub mod music_folder;
pub mod playlist;
pub mod song;
pub mod song_folder;
pub mod statistics;

pub use connection::{Database, Db};
