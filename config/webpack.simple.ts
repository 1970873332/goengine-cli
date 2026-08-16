import { resolvePath } from "@/lib/utils/obtain/dir";
import EngineConfig from "@/engine.config.json";
import { resolve } from "path";
import { Configuration } from "webpack";
import { alias, extensions } from "./module";
import { useBabelLoader, useTSLoader } from "./webpack";

const {
    web: { out },
} = EngineConfig;

export const Config: Configuration = {
    stats: "errors-only",
    /* 输出 */
    output: {
        filename: "[name]-[hash].js",
        path: resolvePath(`${out} ${Date.now()}`),
    },
    /* 解析 */
    resolve: {
        extensions: extensions(),
        alias: alias(),
        fallback: {
            fs: false,
            path: resolve("path-browserify"),
        },
    },
    /* 模块 */
    module: {
        rules: [
            /* 脚本 */
            {
                test: /\.(j|t)s$/i,
                use: useTSLoader(useBabelLoader()),
                exclude: /node_modules/,
            },
        ],
    },
    /* 优化 */
    optimization: {
        minimize: true,
        usedExports: true,
        sideEffects: true,
    },
};
