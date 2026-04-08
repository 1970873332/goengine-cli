import { scripts } from "@/package.json";
import { execSync } from "child_process";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const commit: string | void = process.argv.slice(2).pop();

if (!commit) throw new Error("请提供要运行的脚本名称或命令。");

function runScript(name: string, env: Record<string, string> = {}) {
    let script: string = scripts[name as keyof typeof scripts] ?? name;

    // 移除 cross-env
    script = script.replace(/^cross-env\s+/, "");

    // 提取环境变量
    const envRegex: RegExp = /(\w+)=([^\s]+)/g,
        matches: RegExpExecArray[] = [...script.matchAll(envRegex)];

    for (const match of matches) {
        const [, key, value] = match;
        env[key] = value;
        script = script.replace(match[0], "");
    }

    // 替换命令
    script = script
        .replace(/\btsx\b/g, "bun")
        .replace(/\bnpm run\b/g, "bun brun")
        .replace(/\bnpx\b/g, "bun x")
        .replace(/\s+&\s+/g, " && ")
        .replace(/rimraf\b/g, scripts.bclean)
        .trim();

    execSync(script, {
        stdio: "inherit",
        env: { ...process.env, ...env },
    });
}

runScript(commit);
