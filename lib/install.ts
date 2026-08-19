/**
 * 依赖安装引导：检测/安装 pnpm、设置镜像并执行 pnpm install。
 * 无第三方依赖，用 tsx 运行（alias / JSON 导入由 tsx 解析）。
 */
import {
    execSync,
    type ExecSyncOptionsWithStringEncoding,
} from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINE_CONFIG_JSON } from "./config/module";

const root: string = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
    engineConfig: { electron: { mirror: string } } = JSON.parse(
        readFileSync(
            join(root, ENGINE_CONFIG_JSON),
            "utf8",
        ),
    );

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
} catch {
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
process.env.ELECTRON_MIRROR = engineConfig.electron.mirror;
execSync("pnpm install", execConfig);
