/**
 * 依赖安装引导：检测/安装 pnpm、设置镜像并执行 pnpm install。
 * 无第三方依赖（不依赖别名解析），用 tsx 运行（node 24 也可直接运行本文件）。
 */
import {
    execSync,
    type ExecSyncOptionsWithStringEncoding,
} from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root: string = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
    engineConfig: { electron: { mirror: string } } = JSON.parse(
        readFileSync(
            join(root, "engine.config.json"),
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
