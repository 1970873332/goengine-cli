import { spawn, spawnSync } from "child_process";
import type {
    ChildProcess,
    SpawnOptions,
    SpawnSyncOptions,
    SpawnSyncReturns,
} from "child_process";
import { existsSync, readFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { NODE_MODULES, PACKAGE_JSON } from "@/lib/config/module";

/**
 * 解析可执行包（bin 名与包名一致）的 JS 入口文件。
 *
 * 不依赖 PATH 中的 node_modules/.bin，而是从当前模块所在位置向上查找
 * 安装目录里的 node_modules/<bin>/package.json，读取 bin 字段指向的 JS 文件，
 * 再通过 process.execPath 启动。
 *
 * 这样发布后的 CLI 在任意 cwd 下都能运行自己声明的依赖（tsx / chii / prettier 等），
 * 兼容 npm 的平铺/嵌套安装与 pnpm 的虚拟存储布局。
 */
export function resolveBin(bin: string, packageName: string = bin): string {
    let dir: string = dirname(fileURLToPath(import.meta.url));

    for (;;) {
        /* 嵌套安装：<pkg>/node_modules/<packageName>/package.json */
        const nested: string = join(
            dir,
            NODE_MODULES,
            packageName,
            PACKAGE_JSON,
        );
        if (existsSync(nested)) {
            const entry: string | null = binEntry(nested, bin);
            if (entry) return entry;
        }

        /* 平铺/虚拟存储：<node_modules>/<packageName>/package.json */
        if (basename(dir) === NODE_MODULES) {
            const hoisted: string = join(dir, packageName, PACKAGE_JSON);
            if (existsSync(hoisted)) {
                const entry: string | null = binEntry(hoisted, bin);
                if (entry) return entry;
            }
        }

        const parent: string = dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }

    throw new Error(
        `❌ 找不到可执行包 ${packageName}（bin: ${bin}）：请确认它已作为 @goengine/cli 的依赖安装`,
    );
}

/**
 * 从包 manifest 中读取 bin 字段并定位 JS 入口
 */
function binEntry(packagePath: string, bin: string): string | null {
    const manifest = JSON.parse(readFileSync(packagePath, "utf8")) as {
        bin?: string | Record<string, string>;
    };
    const spec: string | undefined =
        typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[bin];
    if (!spec) return null;

    const entry: string = join(dirname(packagePath), spec);
    return existsSync(entry) ? entry : null;
}

/**
 * 同步执行 bin（stdio 继承），返回 spawnSync 结果
 */
export function runBin(
    bin: string,
    args: string[],
    options: SpawnSyncOptions = {},
    packageName: string = bin,
): SpawnSyncReturns<string | Buffer<ArrayBuffer>> {
    return spawnSync(
        process.execPath,
        [resolveBin(bin, packageName), ...args],
        {
            stdio: "inherit",
            encoding: "utf-8",
            ...options,
        },
    );
}

/**
 * 异步执行 bin，返回子进程（由调用方监听 close / error）
 */
export function spawnBin(
    bin: string,
    args: string[],
    options: SpawnOptions = {},
    packageName: string = bin,
): ChildProcess {
    return spawn(process.execPath, [resolveBin(bin, packageName), ...args], {
        stdio: "inherit",
        ...options,
    });
}
