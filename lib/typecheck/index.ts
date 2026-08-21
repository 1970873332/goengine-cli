#!/usr/bin/env node

import { TSCONFIG_JSON } from "@/lib/config/module";
import { registerErrorHandlers } from "@/lib/utils/error";
import { runBin } from "@/lib/utils/run";
import { detectProjectType, WebProjectType } from "@/lib/utils/project";

registerErrorHandlers();

/** typecheck 的 bin 配置：vue-tsc / tsc / ngc 均为 CLI 自身依赖，用户侧无需安装 */
const TYPECHECK_BIN: Record<
    WebProjectType,
    { bin: string; packageName: string; args: string[] }
> = {
    vue: {
        bin: "vue-tsc",
        packageName: "vue-tsc",
        args: ["--noEmit", "--pretty", "false"],
    },
    react: {
        bin: "tsc",
        packageName: "typescript",
        args: ["-p", TSCONFIG_JSON, "--noEmit", "--pretty", "false"],
    },
    angular: {
        bin: "ngc",
        packageName: "@angular/compiler-cli",
        args: ["-p", TSCONFIG_JSON, "--noEmit"],
    },
};

/** 运行 typecheck，返回退出码（未捕获异常由 registerErrorHandlers 兜底） */
export function runTypecheck(
    cwd: string = process.cwd(),
    project?: string,
): number {
    const type: WebProjectType = detectProjectType(cwd),
        spec = TYPECHECK_BIN[type],
        args: string[] = project
            ? spec.args.map((arg) => (arg === TSCONFIG_JSON ? project : arg))
            : spec.args;

    console.log(`🔍 正在对 ${type} 项目执行类型检查...`);

    const result = runBin(spec.bin, args, { cwd }, spec.packageName);
    return result.status ?? 1;
}

/* 入口即执行：与其它命令一致，参数来自 runModule 重置后的 process.argv */
const argv: string[] = process.argv.slice(2);
let project: string | undefined;

for (let i = 0; i < argv.length; i++) {
    const arg: string = argv[i];
    if (arg === "-p" || arg === "--project") project = argv[i + 1];
}

process.exit(runTypecheck(process.cwd(), project));
