import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { resolvePath } from "./dir";

/**
 * 验证文件
 * @param path - 路径
 * @param pattern - 匹配模式
 * @returns
 */
export async function validateFile(
    path: string,
    pattern: string,
): Promise<boolean> {
    try {
        const resultPath: string = resolvePath(path),
            files: Dirent[] = await readdir(resultPath, {
                withFileTypes: true,
            });
        return files.some(
            (item) =>
                item.isFile() && item.name.match(new RegExp(pattern, "i")),
        );
    } catch {
        return false;
    }
}
