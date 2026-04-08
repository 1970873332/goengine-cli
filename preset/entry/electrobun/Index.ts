import { BrowserWindow } from "electrobun/bun";
import { userData } from "../../../package.json";

console.error("Electrobun遗留问题：");
console.error("路径别名解析 ❌");
console.error("自定义config路径 ❌");
console.error("热更新进程占用 ❌");

const {
    title,
    electron: {
        dev: {
            index: {
                agreement,
                host,
                port
            }
        }
    }
} = userData,
    win = new BrowserWindow({
        title,
        url: `${agreement}://${host}:${port}`,
    });
