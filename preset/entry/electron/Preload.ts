import { BaseExpose } from "@electron/preload/expose/Base";
import { contextBridge } from "electron";

const preload = BaseExpose.obtainInstance();

if (!process.contextIsolated) Object.assign(window, { GoEngine: preload });
else contextBridge.exposeInMainWorld("GoEngine", preload);

export { BaseExpose as PreloadClass };
