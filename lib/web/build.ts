import { createConfig } from "@/lib/config/webpack";
import webpack, { Configuration } from "webpack";
import { webpackBuildCallback } from "../utils/callback";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";
import { ensurePresetEntry } from "../utils/preset";

registerErrorHandlers();

const {
        application: { entry },
    } = loadProjectConfig(),
    { filePath, projectPath } = await selectEntryFile(".", entry),
    projectConfig = await obtainProjectConfig(projectPath),
    config: Configuration = {
        ...createConfig(projectConfig.mod ?? {}),
        entry: filePath,
        mode: "production",
    };

/* webpack 入口模板不存在时按需写入 */
await ensurePresetEntry(projectPath, loadProjectConfig().webpack.input);
console.log("🚀 开始构建...");
webpack(config, webpackBuildCallback);
