#!/usr/bin/env node

import { createRequire } from "node:module";
import { COMMANDS, runModule } from "./dispatch";

const require = createRequire(import.meta.url),
    pkg = require("../package.json") as {
        version: string;
        description: string;
    },
    argv: string[] = process.argv.slice(2);

function showHelp(): void {
    const lines: string[] = [
        `${pkg.description} v${pkg.version}`,
        "",
        "用法:",
        "  goengine <command> [args...]",
        "",
        "命令:",
    ];

    for (const spec of COMMANDS) {
        const alias: string = spec.aliases?.length
            ? `（${spec.aliases.join(" / ")}）`
            : "";
        lines.push(`  ${spec.name.padEnd(18)}${spec.description}${alias}`);
    }

    lines.push(
        "",
        "示例:",
        "  goengine create:web --name demo --type React",
        "  goengine web:serve",
        "  goengine init:web",
        "",
        "提示: 发布包内不包含仓库源码，命令在用户当前项目目录下运行。",
    );

    console.log(lines.join("\n"));
}

async function main(): Promise<void> {
    if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
        showHelp();
        return;
    }

    if (argv[0] === "--version" || argv[0] === "-v") {
        console.log(pkg.version);
        return;
    }

    const [name, ...args] = argv,
        spec = COMMANDS.find(
            (item) =>
                item.name === name || item.aliases?.some((a) => a === name),
        );

    if (!spec) {
        console.error(`❌ 未知命令: ${name}\n`);
        showHelp();
        process.exitCode = 1;
        return;
    }

    try {
        if (spec.load) {
            await runModule(spec.load, args);
        }
    } catch (error) {
        console.error(error instanceof Error ? `❌ ${error.message}` : error);
        process.exitCode = 1;
    }
}

main();
