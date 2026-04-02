import { userData } from "@/package.json";
import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
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
} catch (event: unknown) {
    try {
        const {
            electron: { mirror },
        } = userData;

        console.log("⬇️ 安装 pnpm...");
        execSync(
            `npm install -g pnpm && pnpm config set ELECTRON_MIRROR ${mirror}`,
            execConfig,
        );
    } catch (event: unknown) {
        throw console.error("❌ 安装 pnpm 失败:", event);
    }
}

console.log("⬇️ 安装项目依赖...");
execSync("pnpm install --shamefully-hoist", execConfig);
