import { input, select } from "@inquirer/prompts";
import EngineConfig from "@/engine.config.json";
import { existsSync } from "fs";
import { cp, mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const {
    title,
    tsconfig: { root: tsconfig_root },
    app: { entry: app_entry, config: project_config },
    static: { favicon, public: public_dir },
    html: { webpack: html_webpack, angular: html_angular },
    web: { out: web_out, index: web_index },
    electron: {
        input: { main: main_input, preload: preload_input },
        dev: {
            server: { protocol, host, port },
        },
    },
} = EngineConfig;

/**
 * 统一的 Web 项目布局：
 * - 项目 = 一个包含入口文件（Main.ts / Main.tsx）的目录
 * - create:web 生成自包含项目（工具链配置 + preset/entry 模板 + 项目配置）
 * - serve / build / electron 等命令通过 selectEntryFile 检查当前目录
 *   是否包含入口文件（Main），不存在则报错
 */

export type WebProjectType = "react" | "vue" | "angular";

const TEMPLATES: Record<WebProjectType, string> = {
    react: "HelloReact",
    vue: "HelloVue",
    angular: "HelloAngular",
};

/** 校验项目名（"." 表示当前目录） */
export function validateProjectName(value: string): string | true {
    if (!value.trim()) return "项目名称不能为空";
    if (/[<>:"/\\|?*]/.test(value)) return "项目名不能包含非法字符";
    return true;
}

export async function promptProjectName(): Promise<string> {
    return input({
        message: "项目名：",
        required: true,
        validate: validateProjectName,
    });
}

export async function promptProjectType(): Promise<WebProjectType> {
    const value: string = await select({
        message: "项目类型：",
        choices: ["React", "Vue", "Angular"],
    });
    return value.toLowerCase() as WebProjectType;
}

export function templateOf(type: string): string | undefined {
    return (
        TEMPLATES[type.toLowerCase() as WebProjectType] ??
        TEMPLATES[type as WebProjectType]
    );
}

/** 向上查找 node_modules（开发态 engine/，打包后 cli/） */
function findNodeModules(start: string): string {
    let dir: string = start;
    for (;;) {
        const candidate: string = join(dir, "node_modules");
        if (existsSync(candidate)) return candidate;
        const parent: string = dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return join(start, "node_modules");
}

const cliNodeModules: string = findNodeModules(
    dirname(fileURLToPath(import.meta.url)),
);

function tsconfigJson(type: WebProjectType): string {
    const paths: string = `        "paths": {
            "@/*": [
                "./*"
            ]
        }`;
    /* Angular 的 AOT 编译需要 TS 程序输出（esbuild 插件读取编译结果），noEmit 会导致
     * "File not found in TypeScript compilation"；React/Vue 仅做类型检查，保留 noEmit。 */
    const noEmit: string =
        type === "angular" ? "" : '        "noEmit": true,\n';

    return `{
    "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
${noEmit}        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "jsx": "preserve",
${paths}
    },
    "include": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.vue",
        "**/*.json"
    ],
    "exclude": [
        "node_modules",
        "dist",
        "build"
    ]
}
`;
}

function projectTs(): string {
    return `/**
 * 项目配置（可选）
 */
export default {
    mod: {
        protocol: "${protocol}",
        host: "${host}",
        port: ${port},
    },
};
`;
}

function indexHtml(): string {
    return `<!doctype html>
<html lang="zh">
    <head>
        <meta charset="UTF-8" />
        <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
        />
        <title>${title}</title>
    </head>
    <body>
    </body>
</html>
`;
}

function angularJson(
    name: string,
    index: string,
    outputPath: string,
    tsConfig: string,
    entry: string,
): string {
    return `{
    "version": 1,
    "cli": {
        "analytics": false,
        "schematicCollections": [
            "@angular-devkit/build-angular"
        ]
    },
    "projects": {
        "${name}": {
            "projectType": "application",
            "root": "",
            "architect": {
                "build": {
                    "builder": "@angular-devkit/build-angular:application",
                    "options": {
                        "outputPath": "${outputPath}",
                        "index": "${index}",
                        "browser": "${entry}.ts",
                        "tsConfig": "${tsConfig}",
                        "styles": [
                            "styles.css"
                        ],
                        "assets": [
                            {
                                "glob": "**/*",
                                "input": "${public_dir}",
                                "output": "/"
                            }
                        ]
                    }
                },
                "serve": {
                    "builder": "@angular-devkit/build-angular:dev-server",
                    "options": {
                        "buildTarget": "${name}:build"
                    }
                }
            }
        }
    }
}
`;
}

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

function projectPackageJson(name: string, type: WebProjectType): string {
    const deps: Record<string, string> = {
        /*
         * @goengine/* 由 CLI 构建时提供（webpack/vite 从 CLI 自身 node_modules 解析），
         * 项目无需安装；发布后如需独立类型检查再按需添加。
         */
    };

    for (const dep of FRAMEWORK_DEPS[type]) {
        deps[dep] = FRAMEWORK_VERSIONS[dep] ?? "latest";
    }

    const dependencies: string = Object.entries(deps)
        .map(([key, value]) => `        "${key}": "${value}"`)
        .join(",\n");

    const scripts: string =
        type === "angular"
            ? `        "serve": "goengine ng:serve",
        "build": "goengine ng:build"`
            : `        "serve": "goengine web:serve",
        "build": "goengine web:build",
        "vite:serve": "goengine vite:serve",
        "vite:build": "goengine vite:build"`;

    const devDependencies: string =
        type === "angular"
            ? `,
    "devDependencies": {
        "@angular-devkit/build-angular": "^21.2.7",
        "@angular/compiler-cli": "^21.2.8"
    }`
            : "";

    return `{
    "name": "${name}",
    "version": "0.1.0",
    "description": "GoEngine ${type} 项目",
    "private": true,
    "type": "module",
    "scripts": {
${scripts}
    },
    "dependencies": {
${dependencies}
    }${devDependencies}
}
`;
}

export interface ScaffoldOptions {
    name: string;
    type: string;
    /** 项目创建在哪个目录下（绝对路径）；name 为 "." 时直接创建在该目录 */
    targetBase: string;
    /** 模板根目录（包含 HelloReact / HelloVue / HelloAngular 与 entry） */
    presetRoot: string;
    /** engine.config.json 内容（可选，写入项目后便于用户自定义） */
    engineConfig?: string;
}

/**
 * 生成自包含的 Web 项目，返回项目绝对路径
 */
export async function scaffoldWebProject(
    options: ScaffoldOptions,
): Promise<string> {
    const type: WebProjectType = (() => {
        const value = options.type.trim().toLowerCase();
        if (!(value in TEMPLATES)) {
            throw new Error(
                `❌ 未知项目类型: ${options.type}（支持 React / Vue / Angular）`,
            );
        }
        return value as WebProjectType;
    })();

    if (validateProjectName(options.name) !== true) {
        throw new Error(`❌ 非法项目名: ${options.name}`);
    }

    const target: string =
        options.name === "."
            ? options.targetBase
            : join(options.targetBase, options.name);

    if (options.name !== "." && existsSync(target)) {
        throw new Error(`❌ 目录已存在: ${target}`);
    }

    const template: string = TEMPLATES[type],
        preset: string = options.presetRoot;

    await mkdir(target, { recursive: true });

    /* 模板源码 */
    await cp(join(preset, template), target, { recursive: true });

    /* 工具链入口模板：路径来自 engine.config.json（html.webpack / html.angular），
     * 源侧相对 engine.config.json 所在目录（CLI 为 assets/）解析，目标侧相对项目根解析；
     * electron 主进程/预加载模板（electron:dev / electron:build 按项目目录解析） */
    const entryTemplate: string = type === "angular" ? html_angular : html_webpack;

    await mkdir(join(target, dirname(entryTemplate)), { recursive: true });
    await cp(
        join(dirname(preset), entryTemplate),
        join(target, entryTemplate),
    );
    await mkdir(join(target, dirname(main_input)), { recursive: true });
    await cp(
        join(dirname(preset), main_input),
        join(target, main_input),
    );
    await cp(
        join(dirname(preset), preload_input),
        join(target, preload_input),
    );

    /* 自包含项目配置 */
    await writeFile(
        join(target, "package.json"),
        projectPackageJson(options.name, type),
    );
    await writeFile(join(target, tsconfig_root), tsconfigJson(type));
    await writeFile(join(target, project_config), projectTs());
    if (type === "angular") {
        await writeFile(
            join(target, "angular.json"),
            angularJson(
                options.name,
                html_angular,
                web_out,
                tsconfig_root,
                app_entry,
            ),
        );
    } else {
        /* Vite 开发/构建所需的入口页面（脚本由 vite-plugin-html 按 entry 注入） */
        await writeFile(join(target, web_index), indexHtml());
    }

    /* 静态资源：favicon（模板引用 /favicon，vite 需要 public/ 目录） */
    const faviconPath: string = join(preset, favicon);
    if (existsSync(faviconPath)) {
        await mkdir(join(target, public_dir), { recursive: true });
        await cp(faviconPath, join(target, public_dir, favicon));
    }

    return target;
}
