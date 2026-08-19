import EngineConfig from "@/engine.config.json";
import { spawnSync } from "child_process";
import { resolve } from "path";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
    electron: {
        build,
        mirror,
        out: { main },
        dev: {
            server: { protocol, host, port },
        },
    },
} = EngineConfig;

if (!/^https?$/.test(protocol)) throw new Error("请求协议格式不正确");

const electronPath: string = resolve(build, main),
    env = {
        ...process.env,
        ENV_PROTOCOL: protocol as ModConfig["protocol"],
        ENV_HOST: host,
        ENV_PORT: String(port),
        /* npx 现场安装 electron 时，二进制下载走 engine.config.json 配置的镜像源 */
        ELECTRON_MIRROR: mirror,
    },
    common: string = `electron "${electronPath}"`;

console.log("🚀 正在启动 Electron...", common);

spawnSync("npx", [common], {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
    env,
    shell: true,
});
