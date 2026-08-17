import { select } from "@inquirer/prompts";
import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { resolvePath, obtainValidFolderNames } from "./dir";

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
        entryRegex: RegExp = new RegExp(pattern, "i");

    /* 目录本身就是一个项目：直接使用入口，无需扫描子目录 */
    const entries: Dirent[] = await readdir(resultPath, {
            withFileTypes: true,
        }),
        directEntry: Dirent | undefined = entries.find(
            (item) => item.isFile() && item.name.match(entryRegex),
        );

    if (directEntry) {
        return {
            filePath: join(resultPath, directEntry.name),
            projectPath: resultPath,
            fileName: directEntry.name,
        };
    }

    const validFolders: string[] = await obtainValidFolderNames(
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
                item.isFile() && item.name.match(new RegExp(pattern, "i")),
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
