import { isAbsolute, resolve } from "path";

/**
 * 解析为绝对路径
 * @param path - 路径
 * @returns 绝对路径
 */
export function resolvePath(path: string): string {
    const result: string = isAbsolute(path)
        ? path
        : resolve(process.cwd(), path);

    return result;
}
