import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import EngineConfig from "@/engine.config.json";
import { resolvePath } from "./dir";

const {
    app: { config: project_config },
} = EngineConfig;

/**
 * 获取项目配置
 * @param path - 路径
 * @param entryFile - 入口文件名
 * @returns
 */
export async function obtainProjectConfig(
    path: string,
    entryFile: string = project_config,
): Promise<Project> {
    const resultPath: string = resolvePath(path),
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
