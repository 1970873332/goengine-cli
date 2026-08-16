import { select } from "@inquirer/prompts";
import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { resolvePath, obtainValidFolderNames } from "./obtain/dir";

/**
 * 选择入口文件
 * @param path - 目标路径
 * @param entryPattern - 匹配模式
 * @returns 入口文件绝对路径、项目目录绝对路径与文件名
 */
export async function selectEntryFile(
    path: string,
    pattern: string,
): Promise<{ filePath: string; projectPath: string; fileName: string }> {
    const resultPath: string = resolvePath(path),
        validFolders: string[] = await obtainValidFolderNames(
            resultPath,
            pattern,
        );

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
            (item) =>
                item.isFile() &&
                item.name.match(new RegExp(pattern, "i")),
        );

    if (!entryFile) {
        throw new Error(`❌ 未找到入口文件 ${pattern}`);
    }

    return {
        filePath: join(projectPath, entryFile.name),
        projectPath,
        fileName: entryFile.name,
    };
}
