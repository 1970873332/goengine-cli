import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { PACKAGE_JSON, TSCONFIG_JSON } from "@/lib/config/module";
import {
    cliRoot,
    projectDependencies,
    tsconfigJson,
    WebProjectType,
} from "./template";

/**
 * 根据现有项目布局推断类型：
 * angular.json → Angular；Main.tsx → React；Main.ts → Vue。
 */
function detectType(): WebProjectType {
    if (existsSync(resolve("angular.json"))) return "angular";
    if (existsSync(resolve("Main.tsx"))) return "react";
    if (existsSync(resolve("Main.ts"))) return "vue";
    throw new Error("❌ 未找到项目入口（Main.ts / Main.tsx）或 angular.json");
}

/** 按键名排序（保持 package.json 可读性） */
function sortKeys(record: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
    );
}

/**
 * 同步 package.json：补齐当前类型所需的框架依赖（用户侧安装），
 * 仅添加缺失项，保留已有依赖及其版本，不影响其它字段。
 * @returns 是否有新增依赖
 */
async function syncProjectDependencies(type: WebProjectType): Promise<boolean> {
    const file: string = resolve(PACKAGE_JSON),
        { dependencies, devDependencies } = projectDependencies(type),
        current: Record<string, any> = existsSync(file)
            ? (JSON.parse(await readFile(file, "utf8")) as Record<string, any>)
            : { name: basename(process.cwd()) },
        added: boolean =
            Object.keys(dependencies).some(
                (key) => current.dependencies?.[key] === undefined,
            ) ||
            Object.keys(devDependencies).some(
                (key) => current.devDependencies?.[key] === undefined,
            );

    if (!added) return false;

    const next: Record<string, any> = {
        ...current,
        dependencies: sortKeys({
            ...(current.dependencies as Record<string, string> | undefined),
            ...dependencies,
        }),
    };
    if (Object.keys(devDependencies).length > 0) {
        next.devDependencies = sortKeys({
            ...(current.devDependencies as Record<string, string> | undefined),
            ...devDependencies,
        });
    } else if (current.devDependencies !== undefined) {
        next.devDependencies = current.devDependencies;
    }

    await writeFile(file, `${JSON.stringify(next, null, 4)}\n`);
    return true;
}

/**
 * 为当前目录同步项目配置：
 * - 生成/更新 tsconfig.json（编辑器代码提示，与 create:web 共用同一套逻辑）；
 * - 补齐 package.json 中当前类型缺失的框架依赖（用户侧安装）。
 * 适合已创建的项目迁移到新依赖模型。
 */
export async function runInitWeb(): Promise<void> {
    const type: WebProjectType = detectType();
    await writeFile(resolve(TSCONFIG_JSON), tsconfigJson(type, cliRoot()));
    const synced: boolean = await syncProjectDependencies(type);
    console.log(
        `✅ 已生成 ${TSCONFIG_JSON}（${type}，@goengine/* 指向 CLI 本地包绝对路径）`,
    );
    synced &&
        console.log(
            `✅ 已同步 ${PACKAGE_JSON}：补充框架依赖（用户侧安装，已保留原有字段与版本）`,
        );
    console.log(
        "ℹ️  如尚未安装依赖，请执行 pnpm install / npm install，并在编辑器里 Restart TS Server",
    );
}

/* 入口即执行：与其它命令一致，参数来自 runModule 重置后的 process.argv */
await runInitWeb();
