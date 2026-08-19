import { createConfig } from "@/lib/config/vite";
import { obtainProjectConfig } from "@/lib/utils/file";
import { selectEntryFile } from "@/lib/utils/select";
import { build, UserConfig } from "vite";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";
import { ensureIndexHtml } from "@/lib/utils/preset";

registerErrorHandlers();

const {
        application: { entry },
    } = loadProjectConfig(),
    { filePath, projectPath } = await selectEntryFile(".", entry),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    config: UserConfig = {
        ...createConfig(filePath, projectConfig.mod ?? {}),
        mode: "production",
    };

/* vite 入口页面不存在时按需写入 */
await ensureIndexHtml(projectPath, "generic");
await build(config);
