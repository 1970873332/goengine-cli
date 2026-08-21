import { existsSync } from "node:fs";
import { join } from "node:path";
import { obtainProjectConfig } from "./file";
import { selectEntryFile } from "./select";

/** 支持的 Web 项目类型（脚手架 / init:web / typecheck 共用） */
export type WebProjectType = "react" | "vue" | "angular";

/**
 * 从项目根目录推断类型（Angular 优先，与脚手架入口约定一致）：
 * angular.json → Angular；Main.tsx → React；Main.ts → Vue。
 */
export function detectProjectType(cwd: string = process.cwd()): WebProjectType {
    if (existsSync(join(cwd, "angular.json"))) return "angular";
    if (existsSync(join(cwd, "Main.tsx"))) return "react";
    if (existsSync(join(cwd, "Main.ts"))) return "vue";
    throw new Error("❌ 未找到项目入口（Main.ts / Main.tsx）或 angular.json");
}

/** 项目解析结果：入口文件、项目目录与项目配置 */
export interface ResolvedProject {
    filePath: string;
    projectPath: string;
    fileName: string;
    /** 项目配置（缺失或格式错误时回退空对象） */
    projectConfig: Project;
}

/**
 * 定位入口文件并读取 Project 配置。
 * 各命令（web / vite / service / electron）统一使用，避免重复的
 * selectEntryFile + obtainProjectConfig 调用序列。
 */
export async function resolveProject(
    entry: string,
    cwd: string = process.cwd(),
): Promise<ResolvedProject> {
    const { filePath, projectPath, fileName } = await selectEntryFile(
        cwd,
        entry,
    );

    return {
        filePath,
        projectPath,
        fileName,
        projectConfig: await obtainProjectConfig(projectPath),
    };
}
