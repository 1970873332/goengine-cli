import { defaultAgreement, useAGREEMENT, useNODE_ENV } from "@/config/module";
import { execSync } from "child_process";
import EngineConfig from "@/engine.config.json";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { service },
    } = EngineConfig,
    [filePath, path]: string[] = await selectTarget(service, "Main"),
    projectConfig: Project = await obtainProjectConfig(path),
    { agreement = defaultAgreement } = projectConfig.mod ?? {},
    NODE_ENV: string = useNODE_ENV("development"),
    USE_AGREEMENT: string = useAGREEMENT(agreement);

console.log("📡 正在启动服务...");
execSync(`cross-env ${NODE_ENV} ${USE_AGREEMENT} tsx ${filePath}`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
