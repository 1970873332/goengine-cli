import EngineConfig from "@/engine.config.json";
import { spawnSync } from "child_process";
import { resolve } from "path";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { entry },
        electron: {
            build,
            mirror,
            out: { main },
            dev: { server: defaultServer },
        },
    } = EngineConfig,
    { projectPath } = await selectEntryFile(".", entry),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    mod: ModConfig = projectConfig.mod ?? {},
    /* Project.ts 缺失或未配置时，回退 engine.config.json 的 electron.dev.server */
    protocol: "http" | "https" = (mod.protocol ??
        defaultServer.protocol) as "http" | "https",
    host: string = mod.host ?? defaultServer.host,
    port: number = mod.port ?? defaultServer.port;

if (!/^https?$/.test(protocol)) throw new Error("请求协议格式不正确");

const electronPath: string = resolve(build, main),
    env = {
        ...process.env,
        ENV_PROTOCOL: protocol,
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
