import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { resolvePath } from "./dir";
import { projectConfig } from "@/lib/config/module";

const {
    application: { config: project_config },
} = projectConfig();

/** 读取项目配置，缺失或格式错误时回退空对象 */
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
