import { defaultAgreement, isHTTPS } from "@/config/module";
import { createConfig } from "@/config/vite";
import { userData } from "@/package.json";
import HTTPSServerManager from "@service/managers/server/common/HTTPS";
import { readFileSync } from "fs";
import { createServer, UserConfig, ViteDevServer } from "vite";
import { SSLUtils } from "../utils/SSL";
import { selectTarget } from "../utils/Select";
import { obtainProjectConfig } from "../utils/obtain/File";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
        ssl: { name },
    } = userData,
    [filePath, path]: string[] = await selectTarget(web, "Main"),
    projectConfig: Project = await obtainProjectConfig(path),
    mod: ModConfig = projectConfig.mod ?? {},
    { remarks, host, port, agreement = defaultAgreement } = mod,
    iss: boolean = isHTTPS(agreement),
    { keyPath, certPath } = SSLUtils.obtainFilePath(
        iss ? await SSLUtils.obtain(name) : void 0,
    ),
    config: UserConfig = {
        ...createConfig(filePath, mod),
        server: {
            host,
            port,
            https: iss
                ? HTTPSServerManager.rebirth({
                      key: readFileSync(keyPath),
                      cert: readFileSync(certPath),
                  })
                : void 0,
        },
        mode: "development",
    },
    viteServer: ViteDevServer = await createServer(config);

console.log(`🚀 启动 Vite 开发服务器... ${remarks ?? ""}`);
viteServer
    .listen()
    .then((_) =>
        console.log(
            `🌐 网络地址: \x1b[32m${viteServer.resolvedUrls?.local[0]}\x1b[0m`,
        ),
    );
