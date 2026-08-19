import { resolvePath } from "@/lib/utils/dir";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { existsSync } from "fs";
import { relative } from "path";
import { defineConfig, UserConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import {
    alias,
    chii,
    defaultProtocol,
    define,
    extensions,
    INDEX_HTML,
    NODE_MODULES,
    projectConfig,
} from "./module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const {
        title,
        web: {
            out: { dir: web_out },
        },
    } = projectConfig(),
    outDir: string = resolvePath(web_out),
    /*
     * CLI（或 engine 开发环境）自身的 node_modules：
     * react 与 @goengine/* 从这里解析，项目无需安装即可运行。
     */
    cliNodeModules: string = join(
        dirname(fileURLToPath(import.meta.url)),
        "..",
        NODE_MODULES,
    );

/*
 * Vite 开发服务器允许读取的目录：
 * - 项目根目录（Vite 默认仅允许它，显式声明后需保留）
 * - CLI 自身 node_modules（第三方依赖符号链接解析后的真实路径）
 * - CLI 工作区包（@goengine/* 符号链接解析后位于 package/ 下）
 * 否则访问 @goengine/* 源码会报 "outside of Vite serving allow list"。
 */
export const fsAllow: string[] = [
    process.cwd(),
    cliNodeModules,
    join(cliNodeModules, "..", "package"),
];

/**
 * 解析 @goengine/* 工作区包源码目录
 *
 * 开发态下 node_modules 中的 @goengine/* 是指向 package/ 的 junction：
 * 若别名指向 junction（node_modules 内），Vite 会给模块 URL 追加 ?v= 版本号，
 * 而包内相对导入解析到 package/ 真实路径不带版本号，导致同一模块在浏览器中被
 * 加载两份，instanceof 判断失效（Batch / Snapshot 无法渲染）。
 * 因此开发态优先解析到 package/ 真实目录；发布态回退到 node_modules 安装包。
 */
function resolveGoEnginePackage(name: string): string {
    const installed = join(cliNodeModules, "@goengine", name),
        workspace = join(cliNodeModules, "..", "package", `goengine-${name}`);

    return existsSync(workspace) ? workspace : installed;
}

export function createConfig(
    entry: string,
    { debug, protocol = defaultProtocol }: ModConfig,
): UserConfig {
    return defineConfig({
        logLevel: "error",
        base: "",
        server: {
            fs: {
                allow: fsAllow,
            },
        },
        build: {
            outDir,
            emptyOutDir: true,
            copyPublicDir: false,
            rollupOptions: {
                /*
                 * vite 原生模式：入口为 html.vite（脚手架按该名写入的页面），
                 * 产物按 html.vite 的文件名输出到 web.out.dir 下（不改名）。
                 */
                input: {
                    [INDEX_HTML.replace(/\.html$/i, "")]: resolvePath(INDEX_HTML),
                },
                output: {
                    format: "iife",
                    entryFileNames: `js/[name]-[hash].js`,
                    chunkFileNames: `js/[name]-[hash].js`,
                    assetFileNames: `assets/[name]-[hash].[ext]`,
                },
            },
        },
        resolve: {
            extensions: extensions(),
            alias: [
                /* react/vue/@goengine/* 前缀替换（子路径有实体文件，可直接替换） */
                ...Object.entries({
                    ...alias(),
                    react: join(cliNodeModules, "react"),
                    "react-dom": join(cliNodeModules, "react-dom"),
                    "react-router-dom": join(
                        cliNodeModules,
                        "react-router-dom",
                    ),
                    vue: join(cliNodeModules, "vue"),
                    "vue-router": join(cliNodeModules, "vue-router"),
                    "@goengine/angular": resolveGoEnginePackage("angular"),
                    "@goengine/canvas": resolveGoEnginePackage("canvas"),
                    "@goengine/core": resolveGoEnginePackage("core"),
                    "@goengine/electrobun": resolveGoEnginePackage("electrobun"),
                    "@goengine/electron": resolveGoEnginePackage("electron"),
                    "@goengine/react": resolveGoEnginePackage("react"),
                    "@goengine/service": resolveGoEnginePackage("service"),
                    "@goengine/vue": resolveGoEnginePackage("vue"),
                    "@goengine/web": resolveGoEnginePackage("web"),
                    "@goengine/webgl": resolveGoEnginePackage("webgl"),
                }).map(([find, replacement]) => ({ find, replacement })),
            ],
        },
        plugins: [
            vue(),
            react(),
            tailwindcss(),
            {
                /*
                 * 着色器文件以原始字符串导出（与 webpack 的 ts-shader-loader 行为一致），
                 * 否则 Vite 会把 GLSL 当作 JS 模块解析（#version 会被识别为私有字段语法）。
                 */
                name: "goengine-shader-loader",
                transform(code: string, id: string): string | void {
                    if (/\.((gl|wg)sl|frag|vert)$/i.test(id.split("?")[0])) {
                        return `export default ${JSON.stringify(code)};`;
                    }
                },
            },
            createHtmlPlugin({
                minify: true,
                entry: relative(process.cwd(), entry),
                /* HTML 入口文件：固定约定 index.html（脚手架写入项目根目录） */
                template: "index.html",
                inject: {
                    data: {
                        title,
                        chii: debug ? chii(protocol) : void 0,
                    },
                },
            }),
        ],
        define: define(!!debug),
    });
}
