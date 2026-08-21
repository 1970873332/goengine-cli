import { createConfig } from "@/lib/config/out.electron";
import { devDependencies } from "@goengine/electron/package.json";
import { Configuration, build as electronBuild } from "electron-builder";
import { readFileSync } from "fs";
import { join } from "path";
import { rimraf } from "rimraf";
import { registerErrorHandlers } from "@/lib/utils/error";
import {
    PACKAGE_JSON,
    projectConfig as loadProjectConfig,
} from "@/lib/config/module";
import { resolveProject } from "../utils/project";

registerErrorHandlers();

const {
        application: { entry },
        electron: {
            build,
            out: { dir, main },
        },
    } = loadProjectConfig(),
    { projectPath, projectConfig } = await resolveProject(entry),
    { electron: electronVersion } = devDependencies,
    /* 打包身份：package.json（version / appId）+ packages.electron 覆盖 */
    electronPackage = projectConfig.packages?.electron ?? {},
    manifest = JSON.parse(
        readFileSync(join(projectPath, PACKAGE_JSON), "utf8"),
    ) as {
        name?: string;
        version?: string;
        appId?: string;
        appName?: string;
    },
    name: string =
        electronPackage.name ?? manifest.appName ?? manifest.name ?? "GoEngine",
    version: string = electronPackage.version ?? manifest.version ?? "0.1.0",
    id: string = electronPackage.id ?? manifest.appId ?? "com.goengine.app",
    config: Configuration = {
        ...createConfig({ name, version, id }),
        electronVersion: electronVersion.replace("^", ""),
        extraMetadata: {
            main: join(build, main),
        },
    };

console.log("📦 开始打包Electron程序...");
await rimraf(dir);
await electronBuild({
    config,
});
