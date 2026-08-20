import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { resolvePath } from "./dir";

/** 按匹配模式选择入口文件，返回文件与项目目录绝对路径 */
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
