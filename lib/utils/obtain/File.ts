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
    try {
        const resultPath: string = normalPath(path),
            filePath: string = join(resultPath, entryFile);

        if (!existsSync(filePath))
            throw console.warn(`⚠️ 配置文件不存在: ${filePath}`);

        const imported = await import(pathToFileURL(filePath).href),
            project: Project = imported.default || imported;

        switch (typeof project) {
            case "object":
                return project;
            default:
                throw console.warn(`❌ 项目配置文件格式错误: ${filePath}`);
        }
    } catch {
        return {};
    }
}
