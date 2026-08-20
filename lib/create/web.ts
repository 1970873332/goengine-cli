import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINE_CONFIG_JSON } from "@/lib/config/module";
import {
    promptProjectName,
    promptProjectType,
    scaffoldWebProject,
} from "@/lib/create/scaffold";
import { cliRoot } from "@/lib/create/template";

const here: string = dirname(fileURLToPath(import.meta.url));

/** 模板根目录：dist/assets/preset（构建脚本从仓库 preset 拷贝） */
function presetRoot(): string {
    return resolve(here, "assets/preset");
}

/** engine.config.json 内容（构建时生成到 assets，写入项目便于用户自定义布局） */
function engineConfigContent(): string {
    return readFileSync(resolve(here, "assets", ENGINE_CONFIG_JSON), "utf8");
}

export async function runCreateWeb(args: string[]): Promise<void> {
    const option = (key: string): string | undefined => {
        const index: number = args.indexOf(key);
        return index >= 0 ? args[index + 1] : undefined;
    };

    const dirIndex: number = args.indexOf("--dir"),
        targetBase: string =
            dirIndex >= 0
                ? resolve(process.cwd(), args[dirIndex + 1] ?? ".")
                : process.cwd(),
        name: string = option("--name") ?? (await promptProjectName()),
        type: string = option("--type") ?? (await promptProjectType());

    const target: string = await scaffoldWebProject({
        name,
        type,
        targetBase,
        cliRoot: cliRoot(),
        presetRoot: presetRoot(),
        engineConfig: engineConfigContent(),
    });

    console.log(`✅ 已创建项目：${name} → ${target}`);
}

/* 入口即执行：与其它命令一致，参数来自 runModule 重置后的 process.argv */
await runCreateWeb(process.argv.slice(2));
