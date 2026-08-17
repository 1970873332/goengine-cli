import { defaultProtocol } from "@/lib/config/module";
import { createConfig } from "@/lib/config/webpack";
import EngineConfig from "@/engine.config.json";
import webpack, { Configuration as WebPackConfiguration } from "webpack";
import WebpackDevServer, { Configuration } from "webpack-dev-server";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const {
        app: { web },
    } = EngineConfig,
    { filePath, projectPath } = await selectEntryFile(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    mod: ModConfig = projectConfig.mod ?? {},
    { remarks, proxy, host, port, protocol = defaultProtocol } = mod,
    devServerOptions: Configuration = {
        host,
        port,
        proxy,
        server: protocol,
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
