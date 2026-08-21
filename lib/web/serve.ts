import {
    defaultProtocol,
    projectConfig as loadProjectConfig,
} from "@/lib/config/module";
import { createConfig } from "@/lib/config/webpack";
import webpack, { Configuration as WebPackConfiguration } from "webpack";
import WebpackDevServer, { Configuration } from "webpack-dev-server";
import { registerErrorHandlers } from "@/lib/utils/error";
import { ensurePresetEntry } from "../utils/preset";
import { resolveProject } from "../utils/project";

registerErrorHandlers();

const {
        application: { entry },
    } = loadProjectConfig(),
    { filePath, projectPath, projectConfig } = await resolveProject(entry),
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
    };

/* webpack 入口模板不存在时按需写入 */
await ensurePresetEntry(projectPath, loadProjectConfig().webpack.input);

const server: WebpackDevServer = new WebpackDevServer(
    devServerOptions,
    webpack(config)!,
);

console.log(`🚀 启动 Webpack 开发服务器... ${remarks ?? ""}`);
server.start().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
