import { input, select } from "@inquirer/prompts";
import EngineConfig from "@/engine.config.json";
import { existsSync } from "fs";
import { cp, mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { PACKAGE_JSON } from "@/lib/config/module";
import {
    angularJson,
    injectHtml,
    injectProjectTs,
    PROJECT_LAYOUT,
    PROJECT_TEMPLATE,
    projectPackageJson,
    tsconfigJson,
    WebProjectType,
} from "./template";

const {
    title,
    tsconfig: { root: tsconfig_root },
    app: { entry: app_entry, config: project_config },
    static: { favicon, public: public_dir },
    html: {
        angular: html_angular,
        vite: html_vite,
    },
    web: { out: web_out },
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
 * - create:web 生成自包含项目（工具链配置 + preset/entries 模板 + 项目配置）
 * - serve / build / electron 等命令通过 selectEntryFile 检查当前目录
 *   是否包含入口文件（Main），不存在则报错
 */

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

export interface ScaffoldOptions {
    name: string;
    type: string;
    /** 项目创建在哪个目录下（绝对路径）；name 为 "." 时直接创建在该目录 */
    targetBase: string;
    /** 模板根目录（包含 templates/ 与 entries/） */
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
        if (!(value in PROJECT_LAYOUT)) {
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
                : join(options.targetBase, options.name),
        layout = PROJECT_LAYOUT[type],
        preset: string = options.presetRoot;

    if (options.name !== "." && existsSync(target)) {
        throw new Error(`❌ 目录已存在: ${target}`);
    }

    await mkdir(target, { recursive: true });

    /* 模板源码（layout.template 相对 preset 根） */
    await cp(join(preset, layout.template), target, { recursive: true });

    /* 工具链入口模板：路径来自 engine.config.json（html.webpack.input），
     * 源侧相对 engine.config.json 所在目录（CLI 为 assets/）解析，目标侧相对项目根解析；
     * electron 主进程/预加载模板（electron:dev / electron:build 按项目目录解析） */
    if (layout.entryTemplate) {
        await mkdir(join(target, dirname(layout.entryTemplate)), {
            recursive: true,
        });
        await cp(
            join(dirname(preset), layout.entryTemplate),
            join(target, layout.entryTemplate),
        );
    }
    await mkdir(join(target, dirname(main_input)), { recursive: true });
    await cp(join(dirname(preset), main_input), join(target, main_input));
    await cp(
        join(dirname(preset), preload_input),
        join(target, preload_input),
    );

    /* 自包含项目配置 */
    await writeFile(
        join(target, PACKAGE_JSON),
        projectPackageJson(options.name, type),
    );
    await writeFile(join(target, tsconfig_root), tsconfigJson(type));
    await mkdir(join(target, dirname(project_config)), { recursive: true });
    await writeFile(
        join(target, project_config),
        injectProjectTs(
            await readFile(join(dirname(preset), PROJECT_TEMPLATE), "utf8"),
            protocol,
            host,
            port,
        ),
    );

    /* index.html：从 preset 源模板复制并注入动态值（如标题） */
    const htmlContent: string = injectHtml(
        await readFile(join(dirname(preset), layout.indexTemplate), "utf8"),
        title,
    );

    if (layout.angular) {
        await writeFile(
            join(target, "angular.json"),
            angularJson(
                options.name,
                html_angular,
                web_out,
                tsconfig_root,
                app_entry,
                public_dir,
            ),
        );
        await writeFile(join(target, html_angular), htmlContent);
    } else {
        await writeFile(join(target, html_vite), htmlContent);
    }

    /* 静态资源：favicon（模板引用 /favicon，vite 需要 public/ 目录） */
    const faviconPath: string = join(preset, favicon);
    if (existsSync(faviconPath)) {
        await mkdir(join(target, public_dir), { recursive: true });
        await cp(faviconPath, join(target, public_dir, favicon));
    }

    return target;
}
