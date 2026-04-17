import { BaseExpose } from "@electron/preload/expose/Base";
import { contextBridge } from "electron";

const
    name: string = "GoEngine",
    preload = BaseExpose.obtainInstance();

if (!process.contextIsolated) Object.assign(window, { [name]: preload });
else contextBridge.exposeInMainWorld(name, preload);

export { BaseExpose as PreloadClass };
