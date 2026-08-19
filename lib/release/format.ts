#!/usr/bin/env node

import { spawnBin } from "@/lib/utils/run";
import { Command } from "commander";
import { existsSync, readdirSync, statSync } from "fs";
import { basename, join } from "path";
import { registerErrorHandlers } from "@/lib/utils/error";
import { NODE_MODULES } from "@/lib/config/module";

registerErrorHandlers();

/**
 * 获取指定目录下的所有子目录（排除指定目录）
 */
function getSubDirectories(dir: string): string[] {
    if (!existsSync(dir)) {
        console.log(`⚠️  目录不存在: ${dir}`);
        return [];
    }

    const items = readdirSync(dir);
    return items
        .filter((item) => !EXCLUDED_DIRS.includes(item))
        .map((item) => join(dir, item))
        .filter((path) => {
            try {
                const stats = statSync(path);
                return stats.isDirectory();
            } catch {
                return false;
            }
        });
}

/**
 * 格式化单个目录
 * @param rootOnly - 仅格式化目录根部的文件（不递归子目录）
 */
function formatDirectory(
    dirPath: string,
    index: number,
    total: number,
    rootOnly: boolean = false,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const dirName = basename(dirPath) || dirPath;
        console.log(
            `\n📦 [${index + 1}/${total}] 格式化: ${dirName}${
                rootOnly ? "（仅根目录文件）" : ""
            }`,
        );

        // 排除 node_modules、public、build、dist 等目录，以及 _packed.tsx 文件
        const patterns: string[] = rootOnly
            ? ["*.{js,jsx,ts,tsx,vue,css,scss,html,json,md}"]
            : [
                  "**/*.{js,jsx,ts,tsx,vue,css,scss,html,json,md}",
                  ...EXCLUDED_DIRS.map((dir) => `!**/${dir}/**`),
                  "!**/*_packed.tsx",
              ];

        const prettier = spawnBin("prettier", ["--write", ...patterns], {
            cwd: dirPath,
        });

        prettier.on("close", (code: number) => {
            if (code === 0) {
                console.log(`✅ [${index + 1}/${total}] ${dirName} 完成`);
                resolve();
            } else {
                console.log(
                    `❌ [${index + 1}/${total}] ${dirName} 失败 (退出码: ${code})`,
                );
                reject(new Error(`格式化 ${dirName} 失败`));
            }
        });

        prettier.on("error", (err) => {
            console.log(
                `❌ [${index + 1}/${total}] ${dirName} 启动失败: ${err.message}`,
            );
            reject(err);
        });
    });
}

/**
 * 执行 prettier 格式化：先格式化扫描根目录下的文件，再逐个格式化子目录
 */
async function runPrettier(rootDir: string, paths: string[]): Promise<void> {
    const total: number = paths.length + 1;
    console.log(`🎨 开始格式化 ${total} 个目录...\n`);

    let successCount = 0;
    let failCount = 0;

    try {
        await formatDirectory(rootDir, 0, total, true);
        successCount++;
    } catch {
        failCount++;
    }

    for (let i = 0; i < paths.length; i++) {
        try {
            await formatDirectory(paths[i], i + 1, total);
            successCount++;
        } catch {
            failCount++;
        }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ 成功: ${successCount} 个目录`);
    if (failCount > 0) {
        console.log(`❌ 失败: ${failCount} 个目录`);
    }
    console.log(`${"=".repeat(50)}`);

    if (failCount > 0) process.exit(1);
}

/**
 * 需要排除的目录列表
 */
const EXCLUDED_DIRS = [
    NODE_MODULES,
    ".angular",
    ".git",
    "public",
    "build",
    "dist",
    "out",
];

// 命令行配置
const program = new Command();

program
    .name("format:dir")
    .description(
        `格式化指定目录及其子目录的源代码（自动排除 ${NODE_MODULES}、public、build、dist 等）`,
    )
    .argument("[directory]", "要扫描的目录路径（默认当前目录）", ".")
    .option("--dry-run", "仅显示将要格式化的目录，不实际执行")
    .parse(process.argv);

const options = program.opts();
const directory = program.args[0] || ".";

console.log(`📂 扫描目录: ${directory}`);

const subDirs = getSubDirectories(directory);

console.log(`📦 发现 ${subDirs.length} 个子目录:`);
for (const dirPath of subDirs) {
    const dirName = basename(dirPath) || dirPath;
    console.log(`  - ${dirName}`);
}

if (options.dryRun) {
    console.log(
        `\n✅ Dry-run 模式：共发现 ${subDirs.length} 个子目录（含根目录文件），未执行格式化`,
    );
    process.exit(0);
}

await runPrettier(directory, subDirs);
console.log(`\n🎉 格式化完成！`);
