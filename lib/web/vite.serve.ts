import { defaultProtocol, isHTTPS } from "@/lib/config/module";
import { createConfig, fsAllow } from "@/lib/config/vite";
import { obtainProjectConfig } from "@/lib/utils/file";
import { selectEntryFile } from "@/lib/utils/select";
import { SSLUtils } from "@/lib/utils/ssl";
import HTTPSServerManager from "@goengine/service/src/manager/server/common/HTTPS";
import { readFileSync } from "fs";
import { createServer, UserConfig, ViteDevServer } from "vite";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig as loadProjectConfig } from "@/lib/config/module";
import { ensureIndexHtml } from "@/lib/utils/preset";

registerErrorHandlers();

const {
        application: { entry },
        ssl: { name },
    } = loadProjectConfig(),
    { filePath, projectPath } = await selectEntryFile(".", entry),
    projectConfig: Project = await obtainProjectConfig(projectPath),
    mod: ModConfig = projectConfig.mod ?? {},
    { remarks, host, port, protocol = defaultProtocol } = mod,
    iss: boolean = isHTTPS(protocol),
    { keyPath, certPath } = SSLUtils.obtainFilePath(
        iss ? await SSLUtils.ensure(name) : void 0,
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
            fs: {
                allow: fsAllow,
            },
        },
        mode: "development",
    };

/* vite 入口页面不存在时按需写入 */
await ensureIndexHtml(projectPath, "generic");

const viteServer: ViteDevServer = await createServer(config);

console.log(`🚀 启动 Vite 开发服务器... ${remarks ?? ""}`);
viteServer
    .listen()
    .then((_) =>
        console.log(
            `🌐 网络地址: \x1b[32m${viteServer.resolvedUrls?.local[0]}\x1b[0m`,
        ),
    )
    .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    });
