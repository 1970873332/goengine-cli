import { createConfig } from "@/lib/config/vite";
import { obtainProjectConfig } from "@/lib/utils/file";
import { selectEntryFile } from "@/lib/utils/select";
import EngineConfig from "@/engine.config.json";
import { build, UserConfig } from "vite";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { web },
    } = EngineConfig,
    { filePath, projectPath } = await selectEntryFile(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    config: UserConfig = {
        ...createConfig(filePath, projectConfig.mod ?? {}),
        mode: "production",
    };

await build(config);
