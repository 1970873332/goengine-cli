import { createConfig } from "@/config/webpack";
import { userData } from "package.json";
import webpack, { Configuration } from "webpack";
import { webpackBuildCallback } from "../utils/Callback";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
    } = userData,
    [filePath]: string[] = await selectTarget(web, "Main"),
    projectConfig = await obtainProjectConfig(filePath),
    config: Configuration = {
        ...createConfig(projectConfig.mod ?? {}),
        entry: filePath,
        mode: "production",
    };

console.log("🚀 开始构建...");
webpack(config, webpackBuildCallback);
