import { createConfig } from "@/lib/config/esbuild";
import { BuildOptions, build as esBuild } from "esbuild";
import { join } from "path";
import { rimraf } from "rimraf";
import { selectEntryFile } from "../utils/select";
import { resolvePath } from "../utils/dir";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";

registerErrorHandlers();

const {
        application: { entry },
        service: {
            out: { dir, main },
        },
    } = loadProjectConfig(),
    { filePath } = await selectEntryFile(".", entry),
    config: BuildOptions = {
        ...createConfig([filePath], resolvePath(join(dir, main))),
        packages: "external",
    };

console.log("🚀 开始构建 Service ...");
await rimraf(dir);
await esBuild(config);
