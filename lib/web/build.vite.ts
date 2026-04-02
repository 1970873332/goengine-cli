import { createConfig } from "@/config/vite";
import { userData } from "@/package.json";
import { build, UserConfig } from "vite";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
    } = userData,
    [filePath, path]: string[] = await selectTarget(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(path),
    config: UserConfig = {
        ...createConfig(filePath, projectConfig.mod ?? {}),
        mode: "production",
    };

build(config);
