import { useAGREEMENT, useBun, useHOST, usePORT } from "@/config/module";
import { execSync } from "child_process";
import EngineConfig from "engine.config.json";
import { resolve } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

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
    common: string = `cross-env ${USE_AGREEMENT} ${USE_HOST} ${USE_PORT} electron ${resolve(build, main)}`,
    ub: string = useBun();

console.log("🚀 正在启动 Electron...", common);
execSync((ub ? `${useBun()} "${common}"` : common).trim(), {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
