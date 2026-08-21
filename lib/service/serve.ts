import {
    defaultProtocol,
    projectConfig as loadProjectConfig,
} from "@/lib/config/module";
import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";
import { resolveProject } from "../utils/project";

registerErrorHandlers();

const {
        application: { entry },
    } = loadProjectConfig(),
    { filePath, projectConfig } = await resolveProject(entry),
    { protocol = defaultProtocol } = projectConfig.mod ?? {};

console.log("📡 正在启动服务...");
runBin("tsx", [filePath], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        NODE_ENV: "development",
        ENV_PROTOCOL: protocol,
    },
});
