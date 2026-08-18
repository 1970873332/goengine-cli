import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { resolvePath } from "./dir";

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
        entryRegex: RegExp = new RegExp(pattern, "i"),
        entries: Dirent[] = await readdir(resultPath, {
            withFileTypes: true,
        }),
        entryFile: Dirent | undefined = entries.find(
            (item) => item.isFile() && item.name.match(entryRegex),
        );

    if (!entryFile) {
        throw new Error(
            `❌ 在目录 ${resultPath} 中没有找到入口文件 "${pattern}"`,
        );
    }

    return {
        filePath: join(resultPath, entryFile.name),
        projectPath: resultPath,
        fileName: entryFile.name,
    };
}
