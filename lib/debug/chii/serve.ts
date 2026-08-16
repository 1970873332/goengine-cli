import { isHTTPS } from "@/config/module";
import { SSLUtils } from "@/lib/utils/ssl";
import { select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { Command } from "commander";
import EngineConfig from "@/engine.config.json";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const protocol: ModConfig["protocol"] = await select({
        message: "选择服务协议",
        choices: ["http", "https"],
    }),
    iss: boolean = isHTTPS(protocol),
    {
        ssl: { name },
    } = EngineConfig,
    { port } = new Command()
        .option("-p, --port <number>", "端口")
        .parse(process.argv)
        .opts(),
    { keyPath, certPath } = SSLUtils.obtainFilePath(
        iss ? await SSLUtils.ensure(name) : void 0,
    ),
    httpsComment: string = iss
        ? `--https --ssl-key "${keyPath}" --ssl-cert "${certPath}"`
        : "";

if (!port) throw new Error("❌ 未指定端口号");

console.log(`⏳ 等待Chii服务器启动中...`);
execSync(`chii start --port ${port} ${httpsComment}`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
