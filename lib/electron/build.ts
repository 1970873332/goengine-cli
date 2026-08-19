import { createConfig } from "@/lib/config/esbuild";
import { BuildOptions, build as esBuild } from "esbuild";
import { join } from "path";
import { rimraf } from "rimraf";
import { resolvePath } from "../utils/dir";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";
import { ensurePresetEntry } from "../utils/preset";

registerErrorHandlers();

const {
        electron: {
            build,
            input: { main: main_input, preload: preload_input },
            out: { main: main_out, preload: preload_out },
        },
    } = loadProjectConfig(),
    buildOptions = (
        entry: string,
        output: string,
        externalNode?: boolean,
    ): BuildOptions => ({
        ...createConfig(
            [entry],
            resolvePath(join(build, output)),
            externalNode,
        ),
        external: ["electron"],
    });

/* electron 主进程/预加载入口模板不存在时按需写入 */
await ensurePresetEntry(process.cwd(), main_input);
await ensurePresetEntry(process.cwd(), preload_input);

await rimraf(build);

console.log("🚀 开始构建 Electron 主进程...");
/* 构建主进程 */
await esBuild(buildOptions(resolvePath(main_input), main_out));

console.log("🚀 开始构建 Electron 预加载脚本...");
/* 构建预加载脚本 */
await esBuild(buildOptions(resolvePath(preload_input), preload_out, true));
