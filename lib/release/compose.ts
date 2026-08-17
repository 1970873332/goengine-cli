import EngineConfig from "@/engine.config.json";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { version } from "@/package.json";
import { copy } from "../utils/fs";
import { resolvePath } from "../utils/dir";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { web, service },
        release: { bundle },
    } = EngineConfig,
    outPath: string = `${bundle}_v${version}`,
    gitignore = readFileSync(resolvePath(".gitignore"), "utf-8"),
    exclude = new Set<string>([
        ...gitignore
            .split("\n")
            .filter((item) => item && !item.startsWith("#"))
            .map((item) => item.trim().replace("**/", ""))
            .filter(Boolean),
        ".git",
        "angular",
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

    const sourcePath: string = resolvePath(dir),
        targetPath: string = resolvePath(outPath);

    await copy(sourcePath, targetPath, async (path: string) => {
        /* 跳过 */
        if (path.includes("node_modules")) throw void 0;
    });

    console.log(`✅ 已拷贝: ${dir}`);
}

console.log(`🎉 已拷贝到: ${outPath}`);
