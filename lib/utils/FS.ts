import { Stats } from "fs";
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import { basename, join } from "path";

/**
 * 拷贝
 * @param path
 * @param targetDir
 * @returns
 */
export async function copy(
    path: string,
    targetDir: string,
    intercept?: (path: string, targetDir: string) => Promise<void>,
): Promise<void> {
    const stats: Stats = await stat(path),
        name: string = basename(path),
        targetPath: string = join(targetDir, name);

    try {
        await intercept?.(path, targetDir);
    } catch {
        return;
    }

    await mkdir(targetDir, { recursive: true });

    if (stats.isDirectory()) {
        const paths: string[] = await readdir(path);

        for (const p of paths) {
            await copy(join(path, p), targetPath, intercept);
        }

        return;
    } else if (stats.isFile()) {
        try {
            await intercept?.(path, targetPath);
        } catch {
            return;
        }

        copyFile(path, targetPath);
    }
}
