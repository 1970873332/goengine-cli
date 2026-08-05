import { useBun } from "@/config/module";
import { workspaces } from "@/package.json";
import { spawnSync } from "child_process";
import fg from "fast-glob";
import { existsSync } from "fs";
import { join } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const modules: string = "node_modules";

// 获取所有需要删除的目录
const directories = workspaces
    .flatMap((pattern: string) => fg.sync(pattern, { onlyDirectories: true }))
    .map((dir: string) => join(dir, modules))
    .filter((dir: string) => existsSync(dir));

// 添加根目录的 node_modules
if (existsSync(modules)) {
    directories.push(modules);
}

if (directories.length === 0)
    throw new Error("✅ 没有找到需要删除的 node_modules 目录");

console.log(`🗑️ 准备删除 ${directories.length} 个 node_modules 目录`);
directories.forEach((dir) => console.log(`  ${dir}`));

const bunCmd: string = useBun();

spawnSync(bunCmd || "npx", ["rimraf", ...directories], {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
    shell: true,
});
