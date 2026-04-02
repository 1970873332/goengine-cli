import { AppUtils } from "@electron/ipc/utils/App";
import { BrowserUtils } from "@electron/ipc/utils/Browser";
import { FileUtils } from "@electron/ipc/utils/File";
import { FileDialogUtils } from "@electron/ipc/utils/FileDialog";
import { SessionUtils } from "@electron/ipc/utils/Session";
import { ShellUtils } from "@electron/ipc/utils/Shell";
import { WebViewUtils } from "@electron/ipc/utils/WebView";
import { WindowUtils } from "@electron/ipc/utils/Window";
import Register from "@electron/scripts/Register";
import Global from "@electron/stores/Global";

Register.initial([
    AppUtils,
    FileDialogUtils,
    FileUtils,
    WebViewUtils,
    WindowUtils,
    BrowserUtils,
    SessionUtils,
    ShellUtils,
]);

Register.register(Global.uri).then((id) => {
    console.log("NodeJS:", process.version);
    Register.addEvent(Global.uri, id);
});
