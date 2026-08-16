import { useAGREEMENT, useBun, useHOST, usePORT } from "@/config/module";
import EngineConfig from "@/engine.config.json";
import { spawnSync } from "child_process";
import { resolve } from "path";
import { registerErrorHandlers } from "@/lib/utils/Error";

registerErrorHandlers();

const {
    electron: {
        build,
        out: { main },
        dev: {
            index: { agreement, host, port },
        },
    },
} = EngineConfig;

if (!/^https?$/.test(agreement)) throw new Error("请求协议格式不正确");

const USE_AGREEMENT: string = useAGREEMENT(agreement as ModConfig["agreement"]),
    USE_HOST: string = useHOST(host),
    USE_PORT: string = usePORT(port),
    electronPath: string = resolve(build, main),
    common: string = `cross-env ${USE_AGREEMENT} ${USE_HOST} ${USE_PORT} electron "${electronPath}"`,
    bunCmd: string = useBun();

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
