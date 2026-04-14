import { normalPath } from "@/lib/utils/obtain/Dir";
import { userData } from "package.json";
import TailwindPostCSS from "@tailwindcss/postcss";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import { existsSync, mkdirSync } from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { resolve } from "path";
import TerserPlugin from "terser-webpack-plugin";
import { VueLoaderPlugin } from "vue-loader";
import webpack, {
    Compiler,
    Configuration,
    RuleSetUse,
    RuleSetUseItem,
} from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { alias, chii, defaultAgreement, define, extensions } from "./module";

const dev: boolean = process.env.NODE_ENV === "development",
    {
        title,
        tsconfig: { index },
        html: { webpack: html_webpack },
        web: { build },
    } = userData;

export function createConfig({
    debug,
    module,
    inspector,
    mergePackage,
    agreement = defaultAgreement,
}: Partial<ModConfig>): Configuration {
    dev && console.log("开发模式✔️");
    debug && console.log("调试模式✔️");
    module && console.log("模块模式✔️");
    mergePackage && console.log("合并包✔️");
    return {
        stats: "errors-only",
        /* 实验功能 */
        experiments: {
            outputModule: !dev && module,
        },
        /* 输出 */
        output: dev
            ? void 0
            : {
                  libraryTarget: module ? "module" : void 0,
                  path: normalPath(`${build} ${Date.now()}`),
                  filename: mergePackage
                      ? "js/[hash].js"
                      : "js/[name]/[hash].js",
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
                    test: /\.(j|t)sx?$/i,
                    use: useTSLoader(useBabelLoader()),
                    exclude: /node_modules/,
                },
                /* Worker脚本 */
                {
                    test: /\.wk$/i,
                    use: useTSLoader("worker-loader"),
                    exclude: /node_modules/,
                },
                /*  模块样式表 */
                {
                    test: /\.module\.(s?)[ac]ss$/i,
                    use: useCSSLoader(true),
                    exclude: /node_modules/,
                },
                /* 样式表 */
                {
                    test: /\.(s?)[ac]ss$/i,
                    use: useCSSLoader(false),
                    exclude: /node_modules|\.module\.(s?)[ac]ss$/i,
                },
                /* vue */
                {
                    test: /\.vue$/i,
                    use: ["vue-loader"],
                    exclude: /node_modules/,
                },
                /* 图标 */
                {
                    test: /\.ico$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "[name][ext]",
                    },
                    exclude: /node_modules/,
                },
                /* 字体 */
                {
                    test: /\.(woff2?|eot|ttf|otf)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "fonts/[name].[hash][ext]",
                    },
                    exclude: /node_modules/,
                },
                /* 图片 */
                {
                    test: /\.(png|jpe?g|gif|webp|svg)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "images/[name].[hash][ext]",
                    },
                    exclude: /node_modules/,
                },
                /* 媒体 */
                {
                    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "media/[name].[hash][ext]",
                    },
                    exclude: /node_modules/,
                },
                /* 三维模型 */
                {
                    test: /\.(glb|gltf|fbx|obj|mtl|hdr)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "models/[name].[hash][ext]",
                    },
                    exclude: /node_modules/,
                },
                /* 着色器 */
                {
                    test: /\.((gl|wg)sl|frag|vert)$/i,
                    loader: "ts-shader-loader",
                    options: {
                        name: "shaders/[name].[hash][ext]",
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        /* 插件 */
        plugins: [
            inspector && new BundleAnalyzerPlugin(),
            new webpack.DefinePlugin(define(!!debug)),
            new HtmlWebpackPlugin({
                title,
                template: normalPath(html_webpack),
                templateParameters: {
                    /* devtool远程调试 */
                    chii: debug ? chii(agreement) : void 0,
                },
            }),
            new MiniCssExtractPlugin({
                filename: mergePackage
                    ? "css/[hash].css"
                    : "css/[name]/[hash].css",
            }),
            new VueLoaderPlugin(),
            {
                apply: (compiler: Compiler) => {
                    /* 打包完成后创建静态文件夹 */
                    !dev &&
                        compiler.hooks.done.tap("create-static-folder", () => {
                            if (compiler.options.output.path) {
                                const staticFolderPath: string = resolve(
                                    compiler.options.output.path,
                                    "static",
                                );
                                !existsSync(staticFolderPath) &&
                                    mkdirSync(staticFolderPath);
                            }
                        });
                },
            },
        ].filter(Boolean),
        /* 优化 */
        optimization: dev
            ? void 0
            : {
                  minimize: true,
                  usedExports: true,
                  sideEffects: true,
                  minimizer: [
                      `...`,
                      new TerserPlugin({
                          terserOptions: {
                              compress: {
                                  drop_console: true,
                              },
                          },
                      }),
                      new CssMinimizerPlugin({
                          minimizerOptions: {
                              preset: [
                                  "default",
                                  {
                                      discardComments: { removeAll: true },
                                  },
                              ],
                          },
                      }),
                  ],
                  splitChunks: mergePackage
                      ? void 0
                      : {
                            chunks: "all",
                            maxSize: 244000,
                            maxInitialRequests: 5,
                            maxAsyncRequests: 30,
                            cacheGroups: {
                                libs: {
                                    name: "libs",
                                    test: /[\\/]node_modules[\\/]/,
                                    priority: 20,
                                    reuseExistingChunk: true,
                                },
                                other: {
                                    name: "other",
                                    minChunks: 2,
                                    priority: 5,
                                    reuseExistingChunk: true,
                                },
                                styles: {
                                    name: "styles",
                                    test: /\.(c|le|sa|sc)ss$/i,
                                    enforce: true,
                                    priority: 50,
                                },
                            },
                        },
              },
    };
}

/**
 * 使用CSS加载器
 * @param module
 * @returns
 */
export function useCSSLoader(module: boolean): RuleSetUse {
    const use: RuleSetUse = module
        ? [
              {
                  loader: "css-loader",
                  options: {
                      modules: {
                          namedExport: false,
                          exportLocalsConvention: "as-is",
                      },
                  },
              },
          ]
        : ["css-loader"];

    return [
        dev ? "style-loader" : MiniCssExtractPlugin.loader,
        ...use,
        {
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: [TailwindPostCSS()],
                },
            },
        },
        "sass-loader",
    ];
}
/**
 * 使用TS加载器
 * @param worker
 */
export function useTSLoader(loader?: RuleSetUseItem): RuleSetUse {
    return [
        loader,
        {
            loader: "ts-loader",
            options: {
                transpileOnly: true,
                happyPackMode: false,
                configFile: index,
                appendTsSuffixTo: [/\.vue$/],
            },
        },
    ].filter(Boolean);
}
/**
 * 使用babel加载器
 * @returns
 */
export function useBabelLoader(): RuleSetUseItem {
    return {
        loader: "babel-loader",
        options: {
            extends: normalPath(".babelrc"),
        },
    };
}
