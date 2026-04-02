import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { isAbsolute, join, resolve } from "path";
import { validateFile } from "../validate/Path";

/**
 * 归一化路径
 * @param path - 路径
 * @returns 绝对路径
 */
export function normalPath(path: string): string {
    const result: string = isAbsolute(path)
        ? path
        : resolve(process.cwd(), path);

    return result;
}

/**
 * 获取有效目录列表
 * @param path - 路径
 * @param pattern - 匹配模式
 * @returns
 */
export async function obtainValidFolders(
    path: string,
    pattern: string,
): Promise<string[]> {
    const resultPath: string = normalPath(path),
        items: Dirent[] = await readdir(resultPath, { withFileTypes: true }),
        folders: string[] = items
            .filter((item) => item.isDirectory())
            .map((item) => item.name),
        validFolders = await Promise.all(
            folders.map(async (folder) => {
                const dir: string = join(resultPath, folder),
                    result: boolean = await validateFile(dir, pattern);
                return result ? folder : null;
            }),
        );

    return validFolders.filter((folder): folder is string => folder !== null);
}
