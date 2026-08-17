import {
    cpSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const here: string = dirname(fileURLToPath(import.meta.url)),
    /* 仓库根（本文件位于 lib/config/） */
    root: string = resolve(here, "..", ".."),
    distAssets: string = join(root, "dist", "assets"),
    /* 构建期临时配置：@/engine.config.json 在 tsup clean 之前被读取 */
    buildConfigPath: string = join(root, "assets", "engine.config.json");

const manifest: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
} = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/**
 * 第三方依赖保持 external（发布包在 dependencies 中声明，由安装方提供），
 * 只把仓库本地源码（lib/、config/、preset/ 等）打包进 dist。
 */
const external: string[] = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
];

/**
 * 从 engine.config.json 生成 CLI 默认布局配置：
 * app.web / app.service 改为 "."（用户项目根目录），其余保持不变。
 */
function cliEngineConfig(): string {
    const source = JSON.parse(
        readFileSync(join(root, "engine.config.json"), "utf8"),
    ) as Record<string, unknown>,
        app = (source.app ?? {}) as Record<string, unknown>;

    source.app = { ...app, web: ".", service: "." };
    return JSON.stringify(source, null, 4);
}

/**
 * 拷贝发布期运行所需的静态资源到 dist/assets：
 * - preset/：脚手架模板（create:web 运行时读取）
 * - engine.config.json：构建时被 lib 模块打包，同时保留一份供排查
 */
function copyAssets(): void {
    rmSync(distAssets, { recursive: true, force: true });
    mkdirSync(distAssets, { recursive: true });
    cpSync(join(root, "preset"), join(distAssets, "preset"), {
        recursive: true,
    });
    /* CLI 默认布局：从 engine 配置派生（app.web / app.service 为 "."） */
    writeFileSync(join(distAssets, "engine.config.json"), cliEngineConfig());
}

/* 构建期：先把派生配置写入仓库级临时位置供 alias 读取（tsup clean 会清空 dist） */
mkdirSync(dirname(buildConfigPath), { recursive: true });
writeFileSync(buildConfigPath, cliEngineConfig());

export default defineConfig({
    entry: { cli: join(root, "lib", "cli.ts") },
    outDir: join(root, "dist"),
    format: ["esm"],
    platform: "node",
    target: "node20",
    bundle: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    onSuccess: async () => {
        copyAssets();
        /* 清理构建期临时配置：运行时只读 dist/assets */
        rmSync(join(root, "assets"), { recursive: true, force: true });
    },
    external,
    /**
     * 工作区包（@goengine/*）不作为发布依赖：
     * 它们只有少量深路径导入，构建时直接打进产物，运行时不依赖 npm 上的版本。
     */
    noExternal: [/^@goengine\//],
    esbuildOptions(options) {
        options.alias = {
            "@": root,
            /* CLI 构建时把 engine.config.json 替换为 CLI 默认布局 */
            "@/engine.config.json": buildConfigPath,
        };
    },
});
