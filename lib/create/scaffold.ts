import { input, select } from "@inquirer/prompts";
import { existsSync } from "fs";
import { cp, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { WebProjectType } from "@/lib/utils/project";
import {
    INDEX_HTML,
    PACKAGE_JSON,
    projectConfig,
    TSCONFIG_JSON,
} from "@/lib/config/module";
import {
    angularJson,
    PROJECT_LAYOUT,
    projectPackageJson,
    tsconfigJson,
} from "./template";

const {
    application: { entry: app_entry },
    static: { favicon, public: public_dir },
    web: {
        out: { dir: web_out },
    },
} = projectConfig();

/** 项目 = 含入口文件（Main.ts / Main.tsx）的目录，由 create:web 生成 */

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
    /** 项目创建目录（绝对路径）；name 为 "." 时直接使用该目录 */
    targetBase: string;
    /** CLI 仓库根目录（生成指向本地包的 tsconfig 绝对路径） */
    cliRoot: string;
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

    /* 复制应用模板 */
    await cp(join(preset, layout.template), target, { recursive: true });

    /* 项目配置；预设入口由消费命令按需写入 */
    await writeFile(
        join(target, PACKAGE_JSON),
        projectPackageJson(options.name, type),
    );
    await writeFile(
        join(target, TSCONFIG_JSON),
        tsconfigJson(type, options.cliRoot),
    );

    if (layout.angular) {
        await writeFile(
            join(target, "angular.json"),
            angularJson(
                options.name,
                INDEX_HTML,
                web_out,
                TSCONFIG_JSON,
                app_entry,
                public_dir,
            ),
        );
    }

    /* 静态资源：favicon（vite 需要 public/ 目录） */
    const faviconPath: string = join(preset, favicon);
    if (existsSync(faviconPath)) {
        await mkdir(join(target, public_dir), { recursive: true });
        await cp(faviconPath, join(target, public_dir, favicon));
    }

    return target;
}
