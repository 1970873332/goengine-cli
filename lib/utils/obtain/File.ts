import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { normalPath } from "./Dir";

/**
 * 获取项目配置
 * @param path - 路径
 * @param entryFile - 入口文件名
 * @returns
 */
export async function obtainProjectConfig(
    path: string,
    entryFile: string = "Project.ts",
): Promise<Project> {
    const resultPath: string = normalPath(path),
        filePath: string = join(resultPath, entryFile);

    if (!existsSync(filePath)) {
        console.warn(`⚠️ 配置文件不存在: ${filePath}`);
        return {};
    }

    try {
        const imported = await import(pathToFileURL(filePath).href),
            project: Project = imported.default || imported;

        if (typeof project === "object") return project;

        console.warn(`❌ 项目配置文件格式错误: ${filePath}`);
        return {};
    } catch {
        return {};
    }
}
