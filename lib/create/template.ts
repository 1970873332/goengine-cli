import EngineConfig from "@/engine.config.json";
import { NODE_MODULES } from "@/lib/config/module";

/** 支持的 Web 项目类型 */
export type WebProjectType = "react" | "vue" | "angular";

/** HTML 模板中的动态值占位符（注入用） */
export const HTML_TITLE_TOKEN: string = "{{title}}";

/** Project.ts 源模板（相对 CLI 资源根，含下方占位符） */
export const PROJECT_TEMPLATE: string = "preset/Project.ts";

/** Project.ts 占位符 */
export const PROJECT_PROTOCOL_TOKEN: string = "{{protocol}}";
export const PROJECT_HOST_TOKEN: string = "{{host}}";
export const PROJECT_PORT_TOKEN: string = "{{port}}";

/** 预设应用模板目录（相对 preset 根） */
const TEMPLATES: Record<WebProjectType, string> = {
    react: "templates/react",
    vue: "templates/vue",
    angular: "templates/angular",
};

/** 各框架声明到项目 package.json 的依赖 */
const FRAMEWORK_DEPS: Record<WebProjectType, string[]> = {
    react: ["react", "react-dom", "react-router-dom"],
    vue: ["vue", "vue-router"],
    angular: [
        "@angular/core",
        "@angular/common",
        "@angular/platform-browser",
        "@angular/router",
        "rxjs",
        "zone.js",
    ],
};

const FRAMEWORK_VERSIONS: Record<string, string> = {
    "@goengine/angular": "^0.1.0",
    "@goengine/react": "^0.1.0",
    "@goengine/vue": "^0.1.0",
    "@angular/common": "^21.2.8",
    "@angular/core": "^21.2.8",
    "@angular/platform-browser": "^21.2.8",
    "@angular/router": "^21.2.8",
    react: "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.9.6",
    rxjs: "^7.8.2",
    vue: "^3.5.13",
    "vue-router": "^4.4.5",
    "zone.js": "^0.16.1",
};

const {
    html: {
        webpack: { input: html_webpack },
    },
} = EngineConfig;

/** 按类型的项目布局（驱动脚手架组装，避免散落 if） */
export interface ProjectLayout {
    /** 应用模板目录（相对 preset 根） */
    template: string;
    /** webpack 入口模板（相对 CLI 资源根；angular 不使用 webpack，为 null） */
    entryTemplate: string | null;
    /** index.html 源模板（相对 CLI 资源根，含 HTML_TITLE_TOKEN 占位符） */
    indexTemplate: string;
    /** 是否为 Angular 项目（决定是否生成 angular.json 与 Angular 入口） */
    angular: boolean;
    /** package.json scripts（对象，序列化时直接 JSON 输出） */
    scripts: Record<string, string>;
    /** package.json devDependencies（对象，可为空） */
    devDependencies: Record<string, string>;
}

export const PROJECT_LAYOUT: Record<WebProjectType, ProjectLayout> = {
    react: {
        template: TEMPLATES.react,
        entryTemplate: html_webpack,
        indexTemplate: "preset/entries/index.html",
        angular: false,
        scripts: {
            serve: "goengine web:serve",
            build: "goengine web:build",
            "vite:serve": "goengine vite:serve",
            "vite:build": "goengine vite:build",
        },
        devDependencies: {},
    },
    vue: {
        template: TEMPLATES.vue,
        entryTemplate: html_webpack,
        indexTemplate: "preset/entries/index.html",
        angular: false,
        scripts: {
            serve: "goengine web:serve",
            build: "goengine web:build",
            "vite:serve": "goengine vite:serve",
            "vite:build": "goengine vite:build",
        },
        devDependencies: {},
    },
    angular: {
        template: TEMPLATES.angular,
        entryTemplate: null,
        indexTemplate: "preset/entries/angular.html",
        angular: true,
        scripts: {
            serve: "goengine ng:serve",
            build: "goengine ng:build",
        },
        devDependencies: {
            "@angular-devkit/build-angular": "^21.2.7",
            "@angular/compiler-cli": "^21.2.8",
        },
    },
};

/** 用占位符向 HTML 模板注入动态值 */
export function injectHtml(html: string, title: string): string {
    return html.replaceAll(HTML_TITLE_TOKEN, title);
}

/** 用占位符向 Project.ts 模板注入 dev server 配置 */
export function injectProjectTs(
    template: string,
    protocol: string,
    host: string,
    port: number,
): string {
    return template
        .replaceAll(PROJECT_PROTOCOL_TOKEN, protocol)
        .replaceAll(PROJECT_HOST_TOKEN, host)
        /* 端口占位符包在 Number("...") 中，保证预设文件是合法 TS，注入后还原为数字 */
        .replaceAll(`Number("${PROJECT_PORT_TOKEN}")`, String(port));
}

/** 生成 package.json（对象序列化） */
export function projectPackageJson(
    name: string,
    type: WebProjectType,
): string {
    const layout = PROJECT_LAYOUT[type],
        dependencies: Record<string, string> = {
            /*
             * @goengine/* 由 CLI 构建时提供（webpack/vite 从 CLI 自身 node_modules 解析），
             * 项目无需安装；发布后如需独立类型检查再按需添加。
             */
        };

    for (const dep of FRAMEWORK_DEPS[type]) {
        dependencies[dep] = FRAMEWORK_VERSIONS[dep] ?? "latest";
    }

    const pkg = {
        name,
        version: "0.1.0",
        description: `GoEngine ${type} 项目`,
        private: true,
        type: "module",
        scripts: layout.scripts,
        dependencies,
        ...(Object.keys(layout.devDependencies).length > 0
            ? { devDependencies: layout.devDependencies }
            : {}),
    };

    return `${JSON.stringify(pkg, null, 4)}\n`;
}

/** 生成 tsconfig.json（对象序列化） */
export function tsconfigJson(type: WebProjectType): string {
    const exclude: string[] = [NODE_MODULES, "dist", "build"];

    /* Angular 由 ng CLI 编译，node_modules 里没有 @goengine/electron；
     * preset/ 下是 CLI 工具链模板，需排除以免 ng 解析报错 */
    if (type === "angular") exclude.push("preset");

    const tsconfig = {
        compilerOptions: {
            target: "ESNext",
            module: "ESNext",
            moduleResolution: "bundler",
            strict: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            /* Angular 的 AOT 编译需要 TS 程序输出（esbuild 插件读取编译结果），noEmit 会导致
             * "File not found in TypeScript compilation"；React/Vue 仅做类型检查，保留 noEmit。 */
            ...(type === "angular" ? {} : { noEmit: true }),
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            jsx: "preserve",
            paths: {
                "@/*": ["./*"],
            },
        },
        include: ["**/*.ts", "**/*.tsx", "**/*.vue", "**/*.json"],
        exclude,
    };

    return `${JSON.stringify(tsconfig, null, 4)}\n`;
}

/** 生成 angular.json（对象序列化） */
export function angularJson(
    name: string,
    index: string,
    outputPath: string,
    tsConfig: string,
    entry: string,
    publicDir: string,
): string {
    const angular = {
        version: 1,
        cli: {
            analytics: false,
            schematicCollections: ["@angular-devkit/build-angular"],
        },
        projects: {
            [name]: {
                projectType: "application",
                root: "",
                architect: {
                    build: {
                        builder: "@angular-devkit/build-angular:application",
                        options: {
                            outputPath,
                            index,
                            browser: `${entry}.ts`,
                            tsConfig,
                            extractLicenses: false,
                            styles: ["styles.css"],
                            assets: [
                                {
                                    glob: "**/*",
                                    input: publicDir,
                                    output: "/",
                                },
                            ],
                        },
                    },
                    serve: {
                        builder: "@angular-devkit/build-angular:dev-server",
                        options: {
                            buildTarget: `${name}:build`,
                        },
                    },
                },
            },
        },
    };

    return `${JSON.stringify(angular, null, 4)}\n`;
}
