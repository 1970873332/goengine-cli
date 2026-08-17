import { execSync, spawn, SpawnOptions } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "./repositories";
import type { Repository } from "./type";

export function checkGit(): boolean {
    try {
        execSync("git --version", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

export function getRepoName(url: string): string {
    return path.basename(url, ".git");
}

export function getRepoPath(repo: Repository): string {
    const repoName = getRepoName(repo.url);
    return path.join(config.targetDir, repoName);
}

export function checkRepoExists(repo: Repository): boolean {
    const repoPath = getRepoPath(repo);
    return (
        fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, ".git"))
    );
}

export function ensureTargetDir(): void {
    if (!fs.existsSync(config.targetDir)) {
        fs.mkdirSync(config.targetDir, { recursive: true });
    }
}

export function getCurrentBranch(repoPath: string): string {
    try {
        const branch = execSync("git branch --show-current", {
            cwd: repoPath,
            encoding: "utf-8",
        }).trim();
        return branch || "main";
    } catch {
        return "main";
    }
}

export function buildGitUrl(url: string, baseUrl?: string): string {
    const pattern: RegExp = /^(https?:\/\/|git@|ssh:\/\/|git:\/\/)/i;

    if (pattern.test(url) || !baseUrl) {
        return url;
    }

    return new URL(url, baseUrl).toString();
}

export function execGitCommand(
    args: string[],
    cwd: string,
    options: {
        stdio?: "inherit" | "pipe" | "ignore";
        showProgress?: boolean;
    } = {},
): Promise<void> {
    return new Promise((resolve, reject) => {
        const { stdio = "pipe", showProgress = false } = options;

        const spawnOptions: SpawnOptions = {
            stdio: stdio as any,
            cwd,
        };

        const gitProcess = spawn("git", args, spawnOptions);

        if (showProgress && stdio === "pipe") {
            gitProcess.stdout?.on("data", (data: Buffer) => {
                const output = data.toString("utf-8"); // 明确指定编码
                if (
                    output.includes("Receiving objects") ||
                    output.includes("Resolving deltas") ||
                    output.includes("Checking connectivity")
                ) {
                    console.log(`   ${output.trim()}`);
                }
            });

            gitProcess.stderr?.on("data", (data: Buffer) => {
                const output = data.toString("utf-8");
                if (
                    output.includes("Receiving objects") ||
                    output.includes("Resolving deltas") ||
                    output.includes("Checking connectivity")
                ) {
                    console.log(`   ${output.trim()}`);
                } else if (
                    !output.includes("Cloning into") &&
                    !output.includes("Already up to date")
                ) {
                    console.error(`   ${output.trim()}`);
                }
            });
        }

        gitProcess.on("close", (code: number) => {
            if (code === 0) resolve();
            else reject(new Error(`git command failed with code ${code}`));
        });

        gitProcess.on("error", reject);
    });
}
