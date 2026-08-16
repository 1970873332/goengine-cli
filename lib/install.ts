import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";
import EngineConfig from "@/engine.config.json";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const execConfig: ExecSyncOptionsWithStringEncoding = {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
};

try {
    console.log("🔍 检测 pnpm...");
    execSync("pnpm --version", {
        ...execConfig,
        stdio: "ignore",
    });
} catch (event: unknown) {
    try {
        console.log("⬇️ 安装 pnpm...");
        execSync("npm install -g pnpm", execConfig);
    } catch (event: unknown) {
        console.error("❌ 安装 pnpm 失败:", event);
        process.exit(1);
    }
}

console.log("⬇️ 安装项目依赖...");
process.env.NODE_USE_SYSTEM_CA = "1";
process.env.ELECTRON_MIRROR = EngineConfig.electron.mirror;
execSync("pnpm install --shamefully-hoist", execConfig);
