import { defaultAgreement } from "@/config/module";
import { createConfig } from "@/config/webpack";
import { userData } from "@/package.json";
import webpack, { Configuration as WebPackConfiguration } from "webpack";
import WebpackDevServer, { Configuration } from "webpack-dev-server";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
    } = userData,
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
server.start().catch(console.error);
