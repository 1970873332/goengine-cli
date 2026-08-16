import { createConfig } from "@/config/esbuild";
import EngineConfig from "@/engine.config.json";
import { BuildOptions, build as esBuild } from "esbuild";
import { join } from "path";
import { selectEntryFile } from "../utils/select";
import { resolvePath } from "../utils/obtain/dir";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { service },
        service: {
            out: { dir, main },
        },
    } = EngineConfig,
    { filePath } = await selectEntryFile(service, "Main"),
    config: BuildOptions = {
        ...createConfig(
            [filePath],
            resolvePath(join(`${dir} ${Date.now()}`, main)),
        ),
        packages: "external",
    };

console.log("🚀 开始构建 Service ...");
esBuild(config);
