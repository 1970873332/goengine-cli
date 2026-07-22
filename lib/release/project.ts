import EngineConfig from "engine.config.json";
import { existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { version } from "package.json";
import { copy } from "../utils/FS";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web, service },
        release: { project },
    } = EngineConfig,
    outPath: string = `${project}_v${version}`,
    // 白名单：指定要拷贝的文件夹
    whitelist = new Set<string>(["package", web, service]),
    // 获取当前目录下的所有文件和文件夹
    dirs: string[] = readdirSync(process.cwd());

/* 删除目标目录（如果存在） */
existsSync(outPath) && rmSync(outPath, { recursive: true, force: true });

/* 创建目标目录 */
!existsSync(outPath) && mkdirSync(outPath, { recursive: true });

/* 拷贝文件 */
for (const dir of dirs) {
    // 白名单检查：只拷贝在白名单中的目录
    if (!whitelist.has(dir)) continue;

    const sourcePath: string = normalPath(dir);
    const targetPath: string = normalPath(outPath);

    await copy(sourcePath, targetPath, async (path: string) => {
        if (path.includes("node_modules") || path.includes(".git"))
            throw void 0;
    });

    console.log(`✅ 已拷贝: ${dir}`);
}

console.log(`🎉 已拷贝到: ${outPath}`);
