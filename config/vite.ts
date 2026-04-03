import { IPUtils } from "@/lib/utils/IP";
import { normalPath } from "@/lib/utils/obtain/Dir";
import { userData } from "@/package.json";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { existsSync, mkdirSync } from "fs";
import { relative, resolve } from "path";
import { defineConfig, UserConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { alias, chii, defaultAgreement, define, extensions } from "./module";

const {
        title,
        web: { build },
    } = userData,
    outDir: string = normalPath(`${build} ${Date.now()}`);

export function createConfig(
    entry: string,
    { debug, agreement = defaultAgreement }: ModConfig,
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
            createHtmlPlugin({
                minify: true,
                entry: relative(process.cwd(), entry),
                inject: {
                    data: {
                        title,
                        chii: debug ? chii(agreement) : void 0,
                    },
                },
            }),
            {
                name: "create-static-folder",
                apply: "build",
                closeBundle() {
                    const staticFolderPath: string = resolve(outDir, "static");
                    !existsSync(staticFolderPath) &&
                        mkdirSync(staticFolderPath, { recursive: true });
                },
            },
        ],
        define: define(!!debug),
    });
}
