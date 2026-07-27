import { AppIPC } from "@goengine/electron/src/ipc/util/App";
import { BrowserIPC } from "@goengine/electron/src/ipc/util/Browser";
import { FileIPC } from "@goengine/electron/src/ipc/util/File";
import { FileDialogIPC } from "@goengine/electron/src/ipc/util/FileDialog";
import { SessionIPC } from "@goengine/electron/src/ipc/util/Session";
import { ShellIPC } from "@goengine/electron/src/ipc/util/Shell";
import { WebViewIPC } from "@goengine/electron/src/ipc/util/WebView";
import { WindowIPC } from "@goengine/electron/src/ipc/util/Window";
import Register from "@goengine/electron/src/script/Register";
import Global from "@goengine/electron/src/store/Global";

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
