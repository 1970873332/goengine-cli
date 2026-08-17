import { defaultProtocol } from "@/lib/config/module";
import EngineConfig from "@/engine.config.json";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { service },
    } = EngineConfig,
    { filePath, projectPath } = await selectEntryFile(service, "Main"),
    projectConfig: Project = await obtainProjectConfig(projectPath),
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
