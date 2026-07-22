import { AppIPC } from "@r/electron/ipc/util/App";
import { BrowserIPC } from "@r/electron/ipc/util/Browser";
import { FileIPC } from "@r/electron/ipc/util/File";
import { FileDialogIPC } from "@r/electron/ipc/util/FileDialog";
import { SessionIPC } from "@r/electron/ipc/util/Session";
import { ShellIPC } from "@r/electron/ipc/util/Shell";
import { WebViewIPC } from "@r/electron/ipc/util/WebView";
import { WindowIPC } from "@r/electron/ipc/util/Window";
import Register from "@r/electron/script/Register";
import Global from "@r/electron/store/Global";

Register.initial([
    AppIPC,
    FileDialogIPC,
    FileIPC,
    WebViewIPC,
    WindowIPC,
    BrowserIPC,
    SessionIPC,
    ShellIPC,
]);

Register.register(Global.uri).then((id) => {
    console.log("NodeJS:", process.version);
    Register.addEvent(Global.uri, id);
});
