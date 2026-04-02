import { select } from "@inquirer/prompts";
import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { normalPath, obtainValidFolders } from "./obtain/Dir";

/**
 * 选择目标
 * @param path - 目标路径
 * @param entryPattern - 匹配模式
 * @returns [匹配到的文件绝对路径, 目录绝对路径, 文件名]
 */
export async function selectTarget(
    path: string,
    pattern: string,
): Promise<[string, string, string]> {
    const resultPath: string = normalPath(path),
        validFolders: string[] = await obtainValidFolders(resultPath, pattern);

    if (validFolders.length === 0) {
        throw new Error(
            `❌ 在目录 ${resultPath} 中没有找到包含入口文件 "${pattern}" 的项目`,
        );
    }

    const selectedFolder: string = await select({
            message: "选择目标项目",
            choices: validFolders,
            loop: false,
        }),
        projectPath: string = join(resultPath, selectedFolder),
        projectDir: Dirent[] = await readdir(projectPath, {
            withFileTypes: true,
        }),
        entryFile: Dirent | undefined = projectDir.find(
            (item) => item.isFile() && item.name.match(pattern),
        );

    if (!entryFile) {
        throw new Error(`❌ 未找到入口文件 ${pattern}`);
    }

    return [join(projectPath, entryFile.name), projectPath, entryFile.name];
}
