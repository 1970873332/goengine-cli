import { userData, version } from "@/package.json";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { copy } from "../utils/FS";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web, service },
        release: { compose },
    } = userData,
    outPath: string = normalPath(join(compose, `v${version}`)),
    gitignore = readFileSync(normalPath(".gitignore"), "utf-8"),
    exclude: Set<string> = new Set([
        ...gitignore
            .split("\n")
            .filter((item) => item && !item.startsWith("#"))
            .map((item) => item.trim().replace("**/", ""))
            .filter((item) => item),
        ".git",
        ".vscode",
        "public",
        web,
        service,
    ]),
    dirs: string[] = readdirSync(process.cwd());

/* 删除目录 */
existsSync(outPath) && rmSync(outPath, { recursive: true, force: true });

/* 创建目录 */
!existsSync(outPath) && mkdirSync(outPath, { recursive: true });

/* 拷贝文件 */
for (const dir of dirs) {
    if (exclude.has(dir)) continue;

    const sourcePath: string = normalPath(dir),
        targetPath: string = normalPath(outPath);

    await copy(sourcePath, targetPath, async (path: string) => {
        /* 跳过 */
        if (path.includes("node_modules")) throw void 0;
    });
}
