import { BuildOptions, Plugin } from "esbuild";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { alias, ENGINE_CONFIG_JSON, NODE_MODULES } from "./module";

/**
 * 向上查找最近的 node_modules：
 * 源码位于 lib/config/，打包后位于 dist/，统一向上定位仓库根的 node_modules。
 */
function findNodeModules(start: string): string {
    let dir: string = start;
    for (;;) {
        const candidate: string = join(dir, NODE_MODULES);
        if (existsSync(candidate)) return candidate;
        const parent: string = dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return join(start, NODE_MODULES);
}

const cliNodeModules: string = findNodeModules(
    dirname(fileURLToPath(import.meta.url)),
);

const EXTENSIONS: string[] = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"];

/**
 * @goengine/* 深路径解析到 CLI 自身 node_modules（与 webpack / vite 一致，
 * 项目无需安装框架包）。esbuild 插件返回的必须是完整文件路径。
 */
function resolveGoengineFile(importPath: string): string | undefined {
    const base: string = join(cliNodeModules, importPath);

    for (const ext of EXTENSIONS) {
        const candidate: string = base + ext;
        if (existsSync(candidate)) return candidate;
    }
    for (const ext of EXTENSIONS) {
        const candidate: string = join(base, "index" + ext);
        if (existsSync(candidate)) return candidate;
    }
    return undefined;
}

const goengineResolvePlugin: Plugin = {
    name: "goengine-resolve",
    setup(build) {
        build.onResolve({ filter: /^@goengine\// }, (args) => {
            const file: string | undefined = resolveGoengineFile(args.path);
            return file ? { path: file } : undefined;
        });
        /* 框架包内 @/engine.config.json：项目自带则优先，否则用 CLI 默认布局配置 */
        build.onResolve({ filter: /^@\/engine\.config\.json$/ }, () => {
            const projectConfig: string = join(
                process.cwd(),
                ENGINE_CONFIG_JSON,
            );
            if (existsSync(projectConfig)) return { path: projectConfig };
            return {
                path: join(
                    dirname(fileURLToPath(import.meta.url)),
                    "assets",
                    ENGINE_CONFIG_JSON,
                ),
            };
        });
    },
};

export function createConfig(
    entry: BuildOptions["entryPoints"],
    output: string,
    externalNode?: boolean,
): BuildOptions {
    return {
        entryPoints: entry,
        outfile: output,
        bundle: true,
        minify: true,
        sourcemap: false,
        platform: "node",
        target: "node16",
        format: externalNode ? "cjs" : "esm",
        alias: alias(),
        plugins: [goengineResolvePlugin],
        loader: {
            ".ts": "ts",
            ".json": "json",
        },
    };
}
