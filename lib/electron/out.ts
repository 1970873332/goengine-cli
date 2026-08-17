import { createConfig } from "@/lib/config/out.electron";
import EngineConfig from "@/engine.config.json";
import { devDependencies } from "@goengine/electron/package.json";
import { Configuration, build as electronBuild } from "electron-builder";
import { join } from "path";
import { rimraf } from "rimraf";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { web },
        electron: {
            build,
            out: { dir, main },
        },
    } = EngineConfig,
    { projectPath } = await selectEntryFile(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    { electron: electronVersion } = devDependencies,
    version: string = electronVersion.replace("^", ""),
    config: Configuration = {
        ...createConfig(projectConfig.packages?.electron ?? {}),
        electronVersion: version,
        extraMetadata: {
            main: join(build, main),
        },
    };

console.log("📦 开始打包Electron程序...");
/* 构建 */
await rimraf(dir);
await electronBuild({
    config,
});
