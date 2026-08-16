import { bunRunCommand, envHOST, envPORT, envPROTOCOL } from "@/config/module";
import EngineConfig from "@/engine.config.json";
import { spawnSync } from "child_process";
import { resolve } from "path";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
    electron: {
        build,
        out: { main },
        dev: {
            server: { protocol, host, port },
        },
    },
} = EngineConfig;

if (!/^https?$/.test(protocol)) throw new Error("请求协议格式不正确");

const ENV_PROTOCOL: string = envPROTOCOL(protocol as ModConfig["protocol"]),
    ENV_HOST: string = envHOST(host),
    ENV_PORT: string = envPORT(port),
    electronPath: string = resolve(build, main),
    common: string = `cross-env ${ENV_PROTOCOL} ${ENV_HOST} ${ENV_PORT} electron "${electronPath}"`,
    bunCmd: string = bunRunCommand();

console.log("🚀 正在启动 Electron...", common);

if (bunCmd) {
    const [command, ...args]: string[] = bunCmd.split(/\s+/);
    spawnSync(command, [...args, common], {
        stdio: "inherit",
        encoding: "utf-8",
        cwd: process.cwd(),
    });
} else {
    spawnSync("npx", [common], {
        stdio: "inherit",
        encoding: "utf-8",
        cwd: process.cwd(),
        shell: true,
    });
}
