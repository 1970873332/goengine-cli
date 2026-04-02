import { normalPath } from "@/lib/utils/obtain/Dir";
import { userData } from "@/package.json";
import { resolve } from "path";
import { Configuration } from "webpack";
import { alias } from "./module";

const {
    tsconfig,
    web: { build },
} = userData;

export const Config: Configuration = {
    stats: "errors-only",
    /* 输出 */
    output: {
        filename: "[name]-[hash].js",
        path: normalPath(`${build} ${Date.now()}`),
    },
    /* 解析 */
    resolve: {
        extensions: [".ts", ".js"],
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
                use: [
                    "babel-loader",
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                            happyPackMode: false,
                            configFile: tsconfig,
                        },
                    },
                ],
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
