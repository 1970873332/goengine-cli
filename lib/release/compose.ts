import EngineConfig from "@/engine.config.json";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { version } from "@/package.json";
import { copy } from "../utils/FS";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web, service },
        release: { compose },
    } = EngineConfig,
    outPath: string = `${compose}_v${version}`,
    gitignore = readFileSync(normalPath(".gitignore"), "utf-8"),
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

    const sourcePath: string = normalPath(dir),
        targetPath: string = normalPath(outPath);

    await copy(sourcePath, targetPath, async (path: string) => {
        /* 跳过 */
        if (path.includes("node_modules")) throw void 0;
    });

    console.log(`✅ 已拷贝: ${dir}`);
}

console.log(`🎉 已拷贝到: ${outPath}`);
