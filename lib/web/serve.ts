import { defaultAgreement } from "@/config/module";
import { createConfig } from "@/config/webpack";
import EngineConfig from "@/engine.config.json";
import webpack, { Configuration as WebPackConfiguration } from "webpack";
import WebpackDevServer, { Configuration } from "webpack-dev-server";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";
import { registerErrorHandlers } from "@/lib/utils/Error";

registerErrorHandlers();

const {
        app: { web },
    } = EngineConfig,
    [filePath, path]: string[] = await selectTarget(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(path),
    mod: ModConfig = projectConfig.mod ?? {},
    { remarks, proxy, host, port, agreement = defaultAgreement } = mod,
    devServerOptions: Configuration = {
        host,
        port,
        proxy,
        server: agreement,
    },
    config: WebPackConfiguration = {
        ...createConfig(mod),
        entry: filePath,
        mode: "development",
    },
    server: WebpackDevServer = new WebpackDevServer(
        devServerOptions,
        webpack(config)!,
    );

console.log(`🚀 启动 Webpack 开发服务器... ${remarks ?? ""}`);
server.start().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
