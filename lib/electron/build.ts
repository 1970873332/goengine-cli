import { createConfig } from "@/config/esbuild";
import { userData } from "@/package.json";
import { BuildOptions, buildSync } from "esbuild";
import { join } from "path";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
    electron: {
        build,
        input: { main: main_input, preload: preload_input },
        out: { main: main_out, preload: preload_out },
    },
} = userData,
    buildOptions = (
        entry: string,
        output: string,
        externalNode?: boolean,
    ): BuildOptions => ({
        ...createConfig([entry], normalPath(join(build, output)), externalNode),
        external: ["electron"],
    });

console.log("🚀 开始构建 Electron 主进程...");
/* 构建主进程 */
buildSync(buildOptions(normalPath(main_input), main_out));

console.log("🚀 开始构建 Electron 预加载脚本...");
/* 构建预加载脚本 */
buildSync(
    buildOptions(
        normalPath(preload_input),
        preload_out,
        true,
    ),
);
