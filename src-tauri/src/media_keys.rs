use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};

/// 前端监听的媒体键事件名，payload 是动作字符串
const MEDIA_CONTROL_EVENT: &str = "media-control";

/// 媒体键与前端动作的对应关系
const MEDIA_KEYS: [(&str, Code); 4] = [
    ("next", Code::MediaTrackNext),
    ("play-pause", Code::MediaPlayPause),
    ("prev", Code::MediaTrackPrevious),
    ("stop", Code::MediaStop),
];

/// 注册系统媒体键。
///
/// WebView2 的媒体会话只有在页面播放过媒体之后才会生效：冷启动时、以及暂停状态下换歌
/// （`<audio>` 换 `src` 会销毁旧的 media player）时，系统根本不会把媒体键交给 webview。
/// 这里绕开媒体会话直接注册系统级快捷键，保证任何时候按媒体键都能控制播放。
pub fn register(app: &AppHandle) {
    for (action, code) in MEDIA_KEYS {
        let result =
            app.global_shortcut()
                .on_shortcut(Shortcut::new(None, code), move |app, _, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    if let Err(error) = app.emit(MEDIA_CONTROL_EVENT, action) {
                        log::warn!("发送媒体键事件失败（{action}）：{error}");
                    }
                });

        if let Err(error) = result {
            log::warn!("注册媒体键失败（{action}），可能已被其他程序占用：{error}");
        }
    }
}
