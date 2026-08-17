import { CHII_PORT, isHTTPS } from "@/lib/config/module";
import { SSLUtils } from "@/lib/utils/ssl";
import { select } from "@inquirer/prompts";
import { Command } from "commander";
import EngineConfig from "@/engine.config.json";
import { runBin } from "../utils/run";
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
        .option("-p, --port <number>", "端口", String(CHII_PORT))
        .parse(process.argv)
        .opts(),
    { keyPath, certPath } = SSLUtils.obtainFilePath(
        iss ? await SSLUtils.ensure(name) : void 0,
    ),
    chiiArgs: string[] = ["start", "--port", String(port)];

if (iss) {
    chiiArgs.push("--https", "--ssl-key", keyPath, "--ssl-cert", certPath);
}

console.log(`⏳ 等待Chii服务器启动中...`);
runBin("chii", chiiArgs, { cwd: process.cwd() });
