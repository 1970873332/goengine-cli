import { resolvePath } from "@/lib/utils/dir";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import EngineConfig from "@/engine.config.json";
import { relative } from "path";
import { defineConfig, UserConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { alias, chii, defaultProtocol, define, extensions } from "./module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const {
        title,
        web: { out },
    } = EngineConfig,
    outDir: string = resolvePath(out),
    /*
     * CLI（或 engine 开发环境）自身的 node_modules：
     * react 与 @goengine/* 从这里解析，项目无需安装即可运行。
     */
    cliNodeModules: string = join(
        dirname(fileURLToPath(import.meta.url)),
        "..",
        "node_modules",
    );

export function createConfig(
    entry: string,
    { debug, protocol = defaultProtocol }: ModConfig,
): UserConfig {
    return defineConfig({
        logLevel: "error",
        base: "",
        build: {
            outDir,
            emptyOutDir: true,
            copyPublicDir: false,
            rollupOptions: {
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
                    "@goengine/angular": join(
                        cliNodeModules,
                        "@goengine",
                        "angular",
                    ),
                    "@goengine/canvas": join(
                        cliNodeModules,
                        "@goengine",
                        "canvas",
                    ),
                    "@goengine/core": join(cliNodeModules, "@goengine", "core"),
                    "@goengine/electrobun": join(
                        cliNodeModules,
                        "@goengine",
                        "electrobun",
                    ),
                    "@goengine/electron": join(
                        cliNodeModules,
                        "@goengine",
                        "electron",
                    ),
                    "@goengine/react": join(
                        cliNodeModules,
                        "@goengine",
                        "react",
                    ),
                    "@goengine/service": join(
                        cliNodeModules,
                        "@goengine",
                        "service",
                    ),
                    "@goengine/vue": join(cliNodeModules, "@goengine", "vue"),
                    "@goengine/web": join(cliNodeModules, "@goengine", "web"),
                    "@goengine/webgl": join(
                        cliNodeModules,
                        "@goengine",
                        "webgl",
                    ),
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
