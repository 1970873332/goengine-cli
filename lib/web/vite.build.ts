import { createConfig } from "@/lib/config/vite";
import { build, UserConfig } from "vite";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";
import { ensureIndexHtml } from "@/lib/utils/preset";
import { resolveProject } from "@/lib/utils/project";

registerErrorHandlers();

const {
        application: { entry },
    } = loadProjectConfig(),
    { filePath, projectPath, projectConfig } = await resolveProject(entry),
    config: UserConfig = {
        ...createConfig(filePath, projectConfig.mod ?? {}),
        mode: "production",
    };

/* vite 入口页面不存在时按需写入 */
await ensureIndexHtml(projectPath, "generic");
await build(config);
