import { resolvePath } from "@/lib/utils/dir";
import TailwindPostCSS from "@tailwindcss/postcss";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { createRequire } from "module";
import { dirname, join, resolve } from "path";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import { VueLoaderPlugin } from "vue-loader";
import webpack, { Configuration, RuleSetUse, RuleSetUseItem } from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import {
    alias,
    chii,
    defaultProtocol,
    define,
    extensions,
    NODE_MODULES,
    projectConfig,
    REGEXP_PATH_SEPARATOR,
    TSCONFIG_JSON,
} from "./module";

const dev: boolean = process.env.NODE_ENV === "development",
    {
        title,
        webpack: { input: html_webpack, out: html_webpack_out },
        web: {
            out: { dir: web_out },
        },
    } = projectConfig();

/**
 * node_modules 排除规则：
 * 普通依赖排除（已发布为 JS/产物），但 @goengine/* 以 TS 源码随 CLI 提供
 * （本地开发是 junction，发布安装是真实目录），必须放行交给 loader 处理。
 * 注意排除 @goengine/* 内部的嵌套 node_modules（第三方依赖仍不处理）。
 */
const excludeNodeModules: RegExp = new RegExp(
    `(^|${REGEXP_PATH_SEPARATOR})${NODE_MODULES}${REGEXP_PATH_SEPARATOR}(?!@goengine${REGEXP_PATH_SEPARATOR})`,
);

/* Angular templateUrl 规则只处理应用内 html；
 * 工具链入口模板目录（html.webpack.input 所在目录，如 preset/entries/）除外 */
const excludeEntryTemplates: RegExp = new RegExp(
    `${dirname(html_webpack).replaceAll("/", REGEXP_PATH_SEPARATOR)}${REGEXP_PATH_SEPARATOR}`,
);

export function createConfig({
    debug,
    esm,
    analyzer,
    bundle,
    protocol = defaultProtocol,
}: Partial<ModConfig>): Configuration {
    dev && console.log("开发模式✔️");
    debug && console.log("调试模式✔️");
    esm && console.log("模块模式✔️");
    bundle && console.log("合并包✔️");
    return {
        stats: "errors-only",
        experiments: {
            outputModule: !dev && esm,
        },
        output: dev
            ? void 0
            : {
                  libraryTarget: esm ? "module" : void 0,
                  path: resolvePath(web_out),
                  clean: true,
                  filename: bundle
                      ? "js/[fullhash].js"
                      : "js/[name]/[fullhash].js",
              },
        resolve: {
            /*
             * 项目 node_modules 优先（框架依赖由用户项目安装），
             * 其次 CLI 自身 node_modules（工具链依赖，如 @babel/runtime/helpers/*）。
             */
            modules: [
                join(process.cwd(), NODE_MODULES),
                join(
                    dirname(fileURLToPath(import.meta.url)),
                    "..",
                    NODE_MODULES,
                ),
                NODE_MODULES,
            ],
            extensions: extensions(),
            alias: alias(),
            fallback: {
                fs: false,
                path: resolve("path-browserify"),
            },
        },
        /*
         * loader 从 CLI 自身 node_modules 解析（项目无需安装构建工具链）
         */
        resolveLoader: {
            modules: [
                join(
                    dirname(fileURLToPath(import.meta.url)),
                    "..",
                    NODE_MODULES,
                ),
                NODE_MODULES,
            ],
        },
        module: {
            rules: [
                {
                    test: /\.(j|t)sx?$/i,
                    use: useTSLoader(useBabelLoader()),
                    exclude: excludeNodeModules,
                },
                {
                    test: /\.wk$/i,
                    use: useTSLoader("worker-loader"),
                    exclude: excludeNodeModules,
                },
                /* CSS Modules */
                {
                    test: /\.module\.(s?)[ac]ss$/i,
                    use: useCSSLoader(true),
                    exclude: excludeNodeModules,
                },
                /* 普通样式表 */
                {
                    test: /\.(s?)[ac]ss$/i,
                    use: useCSSLoader(false),
                    exclude: new RegExp(
                        `${excludeNodeModules.source}|\.module\.(s?)[ac]ss$`,
                        "i",
                    ),
                },
                {
                    test: /\.vue$/i,
                    use: ["vue-loader"],
                    exclude: excludeNodeModules,
                },
                /* Angular 模板：html 以字符串内联（webpack5 asset/source） */
                {
                    test: /\.html$/i,
                    type: "asset/source",
                    exclude: [excludeNodeModules, excludeEntryTemplates],
                },
                {
                    test: /\.ico$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "[name][ext]",
                    },
                    exclude: excludeNodeModules,
                },
                /* 字体 */
                {
                    test: /\.(woff2?|eot|ttf|otf)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "fonts/[name].[contenthash][ext]",
                    },
                    exclude: excludeNodeModules,
                },
                /* 图片 */
                {
                    test: /\.(png|jpe?g|gif|webp|svg)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "images/[name].[contenthash][ext]",
                    },
                    exclude: excludeNodeModules,
                },
                /* 媒体 */
                {
                    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "media/[name].[contenthash][ext]",
                    },
                    exclude: excludeNodeModules,
                },
                /* 三维模型 */
                {
                    test: /\.(glb|gltf|fbx|obj|mtl|hdr)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "models/[name].[contenthash][ext]",
                    },
                    exclude: excludeNodeModules,
                },
                /* 着色器 */
                {
                    test: /\.((gl|wg)sl|frag|vert)$/i,
                    loader: "ts-shader-loader",
                    options: {
                        name: "shaders/[name].[contenthash][ext]",
                    },
                    exclude: excludeNodeModules,
                },
            ],
        },
        plugins: [
            analyzer && new BundleAnalyzerPlugin(),
            new webpack.DefinePlugin(define(!!debug)),
            new HtmlWebpackPlugin({
                title,
                /* Web 构建入口文件名（html.webpack.out） */
                filename: html_webpack_out,
                template: resolvePath(html_webpack),
                templateParameters: {
                    /* devtool远程调试 */
                    chii: debug ? chii(protocol) : void 0,
                },
            }),
            new MiniCssExtractPlugin({
                filename: bundle
                    ? "css/[fullhash].css"
                    : "css/[name]/[fullhash].css",
            }),
            new VueLoaderPlugin(),
        ].filter(Boolean),
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
                  splitChunks: bundle
                      ? void 0
                      : {
                            chunks: "all",
                            maxSize: 244000,
                            maxInitialRequests: 5,
                            maxAsyncRequests: 30,
                            cacheGroups: {
                                libs: {
                                    name: "libs",
                                    test: new RegExp(
                                        `${REGEXP_PATH_SEPARATOR}${NODE_MODULES}${REGEXP_PATH_SEPARATOR}`,
                                    ),
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

/** CSS 加载器（module 为 true 时启用 CSS Modules） */
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
/** TS 加载器（可选前置 loader，如 worker-loader） */
export function useTSLoader(loader?: RuleSetUseItem): RuleSetUse {
    return [
        loader,
        {
            loader: "ts-loader",
            options: {
                transpileOnly: true,
                happyPackMode: false,
                configFile: TSCONFIG_JSON,
                appendTsSuffixTo: [/\.vue$/],
            },
        },
    ].filter(Boolean);
}

/**
 * 以 CLI（或 engine 开发环境）自身 node_modules 的绝对路径引用 babel 插件，
 * 避免 babel 按 .babelrc 所在目录（用户项目）解析而找不到插件。
 */
const babelRequire = createRequire(import.meta.url);

/** Babel 加载器（内联配置，忽略项目 .babelrc） */
export function useBabelLoader(): RuleSetUseItem {
    return {
        loader: "babel-loader",
        options: {
            /* 忽略项目里的 .babelrc / babel.config.*，统一使用下方内联配置 */
            babelrc: false,
            configFile: false,
            presets: [
                babelRequire.resolve("@babel/preset-env"),
                [
                    babelRequire.resolve("@babel/preset-react"),
                    { runtime: "automatic" },
                ],
            ],
            plugins: [
                [
                    babelRequire.resolve("@babel/plugin-transform-runtime"),
                    { regenerator: true },
                ],
                babelRequire.resolve(
                    "@babel/plugin-transform-optional-chaining",
                ),
            ],
        },
    };
}
