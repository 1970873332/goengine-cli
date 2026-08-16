import { defaultProtocol, envNODE_ENV, envPROTOCOL } from "@/config/module";
import { execSync } from "child_process";
import EngineConfig from "@/engine.config.json";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/obtain/file";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { service },
    } = EngineConfig,
    { filePath, projectPath } = await selectEntryFile(service, "Main"),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    { protocol = defaultProtocol } = projectConfig.mod ?? {},
    NODE_ENV: string = envNODE_ENV("development"),
    ENV_PROTOCOL: string = envPROTOCOL(protocol);

console.log("📡 正在启动服务...");
execSync(`cross-env ${NODE_ENV} ${ENV_PROTOCOL} tsx "${filePath}"`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
