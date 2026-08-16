import { createConfig } from "@/config/out.electron";
import EngineConfig from "@/engine.config.json";
import { devDependencies } from "@goengine/electron/package.json";
import { Configuration, build as electronBuild } from "electron-builder";
import { join } from "path";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";
import { registerErrorHandlers } from "@/lib/utils/Error";

registerErrorHandlers();

const {
        app: { web },
        electron: {
            build,
            out: { main },
        },
    } = EngineConfig,
    [_, path] = await selectTarget(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(path),
    { electron: electronVersion } = devDependencies,
    version: string = electronVersion.replace("^", ""),
    config: Configuration = {
        ...createConfig(projectConfig.package?.electron ?? {}),
        electronVersion: version,
        extraMetadata: {
            main: join(build, main),
        },
    };

console.log("📦 开始打包Electron程序...");
/* 构建 */
await electronBuild({
    config,
});
