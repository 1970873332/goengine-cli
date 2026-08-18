import { createConfig } from "@/lib/config/esbuild";
import EngineConfig from "@/engine.config.json";
import { BuildOptions, build as esBuild } from "esbuild";
import { join } from "path";
import { rimraf } from "rimraf";
import { selectEntryFile } from "../utils/select";
import { resolvePath } from "../utils/dir";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { entry },
        service: {
            out: { dir, main },
        },
    } = EngineConfig,
    { filePath } = await selectEntryFile(".", entry),
    config: BuildOptions = {
        ...createConfig([filePath], resolvePath(join(dir, main))),
        packages: "external",
    };

console.log("🚀 开始构建 Service ...");
await rimraf(dir);
await esBuild(config);
