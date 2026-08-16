import { resolvePath } from "@/lib/utils/obtain/dir";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import EngineConfig from "@/engine.config.json";
import { relative } from "path";
import { defineConfig, UserConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { alias, chii, defaultProtocol, define, extensions } from "./module";

const {
        title,
        web: { out },
    } = EngineConfig,
    outDir: string = resolvePath(`${out} ${Date.now()}`);

export function createConfig(
    entry: string,
    { debug, protocol = defaultProtocol }: ModConfig,
): UserConfig {
    return defineConfig({
        logLevel: "error",
        base: "",
        build: {
            outDir,
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
            alias: alias(),
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
