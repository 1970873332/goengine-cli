import { createConfig } from "@/config/webpack";
import EngineConfig from "@/engine.config.json";
import webpack, { Configuration } from "webpack";
import { webpackBuildCallback } from "../utils/callback";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/obtain/file";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { web },
    } = EngineConfig,
    { filePath, projectPath } = await selectEntryFile(web, "Main"),
    projectConfig = await obtainProjectConfig(projectPath),
    config: Configuration = {
        ...createConfig(projectConfig.mod ?? {}),
        entry: filePath,
        mode: "production",
    };

console.log("🚀 开始构建...");
webpack(config, webpackBuildCallback);
