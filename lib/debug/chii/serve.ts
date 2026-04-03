import { isHTTPS } from "@/config/module";
import { SSLUtils } from "@/lib/utils/SSL";
import { userData } from "@/package.json";
import { select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { Command } from "commander";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const agreement: ModConfig["agreement"] = await select({
        message: "选择服务协议",
        choices: ["http", "https"],
    }),
    iss: boolean = isHTTPS(agreement),
    {
        ssl: { name },
    } = userData,
    { port } = new Command()
        .option("-p, --port <number>", "端口")
        .parse(process.argv)
        .opts(),
    { keyPath, certPath } = SSLUtils.obtainFilePath(
        iss ? await SSLUtils.obtain(name) : void 0,
    ),
    httpsComment: string = iss
        ? `--https --ssl-key ${keyPath} --ssl-cert ${certPath}`
        : "";

if (!port) throw console.error("❌ 未指定端口号");

console.log(`⏳ 等待Chii服务器启动中...`);
execSync(`chii start --port ${port} ${httpsComment}`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
