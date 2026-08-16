import { BrowserWindow } from "electrobun/bun";
import EngineConfig from "@/engine.config.json";

console.error("Electrobun遗留问题：");
console.error("热更新进程占用 ❌");

const {
    title,
    electron: {
        dev: {
            server: { protocol, host, port },
        },
    },
} = EngineConfig;
new BrowserWindow({
    title,
    url: `${protocol}://${host}:${port}`,
});
