import { existsSync } from "fs";
import { cp, mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { INDEX_HTML, projectConfig } from "@/lib/config/module";
import { injectHtml } from "@/lib/create/template";

/** CLI 预设根（dist/assets/preset） */
export function presetRoot(): string {
    return resolve(dirname(fileURLToPath(import.meta.url)), "assets/preset");
}

/** 确保预设入口文件存在（不存在时从 CLI 预设复制，返回目标路径） */
export async function ensurePresetEntry(
    projectPath: string,
    relativePath: string,
): Promise<string> {
    const target: string = join(projectPath, relativePath);
    if (existsSync(target)) return target;
    await mkdir(dirname(target), { recursive: true });
    await cp(join(dirname(presetRoot()), relativePath), target);
    console.log(`📝 已生成预设入口: ${target}`);
    return target;
}

/** 确保项目根 index.html 存在（不存在时按模板生成并注入标题） */
export async function ensureIndexHtml(
    projectPath: string,
    kind: "generic" | "angular",
): Promise<string> {
    const target: string = join(projectPath, INDEX_HTML);
    if (existsSync(target)) return target;
    const template: string =
        kind === "angular"
            ? "preset/entries/angular.html"
            : "preset/entries/index.html";
    await writeFile(
        target,
        injectHtml(
            await readFile(join(dirname(presetRoot()), template), "utf8"),
            projectConfig().title,
        ),
    );
    console.log(`📝 已生成入口页面: ${target}`);
    return target;
}
