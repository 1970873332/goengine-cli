import { cloneAll } from "./lib/clone";
import { pullAll } from "./lib/pull";
import { pushAll } from "./lib/push";
import { config } from "./repositories";
import { statusAll } from "./lib/status";
import type { Repository } from "./type";
import { checkGit } from "./util/util";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

function parseArgs(args: string[]): {
    command: string;
    forcePush: boolean;
    specificRepos: string[];
    help: boolean;
} {
    const command = args[0]?.toLowerCase() || "";
    const options = args.slice(1);

    const forcePush = options.includes("--force");
    const help = options.includes("--help");
    const specificRepos = options.filter(opt => !opt.startsWith("-"));

    return { command, forcePush, specificRepos, help };
}

function getReposToProcess(specificNames: string[]): Repository[] {
    if (specificNames.length === 0) {
        return config.repositories;
    }

    return specificNames
        .map(name => {
            return config.repositories.find(r =>
                r.url === name ||
                r.url === `${name}.git` ||
                r.url.replace(/\.git$/, "") === name
            );
        })
        .filter((r): r is Repository => r !== void 0);
}

function showHelp(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Git 批量管理工具                                ║
╚═══════════════════════════════════════════════════════════╝

Usage: git <command> [options] [repo-names...]

Commands:
  clone     Clone all repositories
  pull      Pull latest changes
  push      Push changes (use --force for force push)
  status    Show git status

Options:
  --force  Force push (only for push command)
  --help   Show this help

Examples:
  git clone                          # Clone all repositories
  git pull                           # Pull all repositories
  git push --force                   # Force push all repositories
  git status                         # Show status of all repos
  git status goengine-core           # Show status of specific repo
  git pull goengine-core goengine-web # Pull specific repos

Repository names can be specified with or without .git suffix.
    `);
}

const args = process.argv.slice(2);
const { command, forcePush, specificRepos, help } = parseArgs(args);

if (help || !command) {
    showHelp();
    throw void 0;
}

if (!checkGit()) {
    throw new Error("❌ Git is not installed or not available in PATH");
}

const repos = getReposToProcess(specificRepos);
if (repos.length === 0) {
    throw new Error("❌ No repositories found to process");
}

const concurrency = config.parallel || repos.length;

console.log(`\n🚀 Processing ${repos.length} repositories...\n`);

try {
    switch (command) {
        case "clone":
            await cloneAll(repos, concurrency);
            break;
        case "pull":
            await pullAll(repos, concurrency);
            break;
        case "push":
            if (forcePush) {
                console.log("⚠️  Force push enabled!");
            }
            await pushAll(repos, concurrency, forcePush);
            break;
        case "status":
            await statusAll(repos, concurrency);
            break;
        default:
            showHelp();
            throw new Error(`❌ Unknown command: ${command}`);
    }
} catch (error) {
    throw new Error(`❌ Error: ${error instanceof Error ? error.message : error}`);
}