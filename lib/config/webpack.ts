import { resolvePath } from "@/lib/utils/dir";
import TailwindPostCSS from "@tailwindcss/postcss";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import EngineConfig from "@/engine.config.json";
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
} from "./module";

const dev: boolean = process.env.NODE_ENV === "development",
    {
        title,
        tsconfig: { root },
        html: {
            webpack: { input: html_webpack, out: html_webpack_out },
        },
        web: { out: web_out },
    } = EngineConfig;

/**
 * node_modules 排除规则：
 * 普通依赖排除（已发布为 JS/产物），但 @goengine/* 以 TS 源码随 CLI 提供
 * （本地开发是 junction，发布安装是真实目录），必须放行交给 loader 处理。
 * 注意排除 @goengine/* 内部的嵌套 node_modules（第三方依赖仍不处理）。
 */
/* 模板字符串需双写反斜杠：`[\\\\/]` 生成正则 `[\\/]`，同时匹配 Windows 反斜杠与正斜杠 */
const excludeNodeModules: RegExp = new RegExp(
    `(^|[\\\\/])${NODE_MODULES}[\\\\/](?!@goengine[\\\\/])`,
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
        /* 实验功能 */
        experiments: {
            outputModule: !dev && esm,
        },
        /* 输出 */
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
        /* 解析 */
        resolve: {
            /*
             * 优先从 CLI（或 engine 开发环境）自身的 node_modules 查找，
             * 让 transform-runtime 注入的 @babel/runtime/helpers/* 等工具链依赖可解析。
             */
            modules: [
                /* 项目自身的 node_modules 放最前，保证 react 等框架包只有一份（用户项目提供） */
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
         * loader 解析：优先从 CLI（或 engine 开发环境）自身的 node_modules 查找，
         * 这样脚手架项目无需安装 webpack / babel-loader 等工具链，CLI 自带即可。
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
        /* 模块 */
        module: {
            rules: [
                /* 脚本 */
                {
                    test: /\.(j|t)sx?$/i,
                    use: useTSLoader(useBabelLoader()),
                    exclude: excludeNodeModules,
                },
                /* Worker脚本 */
                {
                    test: /\.wk$/i,
                    use: useTSLoader("worker-loader"),
                    exclude: excludeNodeModules,
                },
                /*  模块样式表 */
                {
                    test: /\.module\.(s?)[ac]ss$/i,
                    use: useCSSLoader(true),
                    exclude: excludeNodeModules,
                },
                /* 样式表 */
                {
                    test: /\.(s?)[ac]ss$/i,
                    use: useCSSLoader(false),
                    exclude: new RegExp(
                        `${excludeNodeModules.source}|\.module\.(s?)[ac]ss$`,
                        "i",
                    ),
                },
                /* vue */
                {
                    test: /\.vue$/i,
                    use: ["vue-loader"],
                    exclude: excludeNodeModules,
                },
                /* Angular templateUrl：把 html 作为字符串内联（webpack5 asset/source） */
                {
                    test: /\.html$/i,
                    type: "asset/source",
                    exclude: [excludeNodeModules, /preset[\\/]entry/],
                },
                /* 图标 */
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
        /* 插件 */
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
                                        `[\\\\/]${NODE_MODULES}[\\\\/]`,
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
                configFile: root,
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

/**
 * 使用babel加载器
 * @returns
 */
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
