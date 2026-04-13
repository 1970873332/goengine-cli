import { createConfig } from "@/config/vite";
import { obtainProjectConfig } from "@/lib/utils/obtain/File";
import { selectTarget } from "@/lib/utils/Select";
import { userData } from "package.json";
import { build, UserConfig } from "vite";

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
