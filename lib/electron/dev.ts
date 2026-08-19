import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { selectEntryFile } from "../utils/select";
import { obtainProjectConfig } from "../utils/file";
import { registerErrorHandlers } from "@/lib/utils/error";
import {
    DEFAULT_HOST,
    DEFAULT_PORT,
    defaultProtocol,
    projectConfig as loadProjectConfig,
} from "@/lib/config/module";
import { injectProjectTs, PROJECT_TEMPLATE } from "../create/template";

registerErrorHandlers();

const {
        application: { entry, config: project_config },
        electron: {
            build,
            mirror,
            out: { main },
        },
    } = loadProjectConfig(),
    { projectPath } = await selectEntryFile(".", entry),
    /* CLI 预设根（dist/assets/preset） */
    preset: string = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "assets/preset",
    ),
    configFile: string = join(projectPath, project_config);

/* Project.ts 缺失时写入默认配置（dev server 配置仅由 Project.ts 提供） */
if (!existsSync(configFile)) {
    await mkdir(dirname(configFile), { recursive: true });
    await writeFile(
        configFile,
        injectProjectTs(
            await readFile(join(dirname(preset), PROJECT_TEMPLATE), "utf8"),
            defaultProtocol,
            DEFAULT_HOST,
            DEFAULT_PORT,
        ),
    );
    console.log(`📝 已生成默认配置: ${configFile}`);
}

const
    projectConfig: Project = await obtainProjectConfig(projectPath),
    mod: ModConfig = projectConfig.mod ?? {},
    protocol: "http" | "https" = (mod.protocol ??
        defaultProtocol) as "http" | "https",
    host: string = mod.host ?? DEFAULT_HOST,
    port: number = mod.port ?? DEFAULT_PORT;

if (!/^https?$/.test(protocol)) throw new Error("请求协议格式不正确");

const electronPath: string = resolve(build, main),
    env = {
        ...process.env,
        ENV_PROTOCOL: protocol,
        ENV_HOST: host,
        ENV_PORT: String(port),
        /* ELECTRON_MIRROR 环境变量优先，其次 engine.config.json 的 mirror */
        ELECTRON_MIRROR: process.env.ELECTRON_MIRROR ?? mirror,
    },
    common: string = `electron "${electronPath}"`;

console.log("🚀 正在启动 Electron...", common);

spawnSync("npx", [common], {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
    env,
    shell: true,
});
