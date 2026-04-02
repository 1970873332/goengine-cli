import { createConfig } from "@/config/out.electron";
import { userData } from "@/package.json";
import { devDependencies } from "@electron/../package.json";
import { Configuration, build as electronBuild } from "electron-builder";
import { join } from "path";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
        electron: {
            build,
            out: { main },
        },
    } = userData,
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
electronBuild({
    config,
});
