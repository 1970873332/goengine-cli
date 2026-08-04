import { formatResults, runWithConcurrency } from "../util/concurrency";
import type { Repository } from "../type";
import {
    checkRepoExists,
    execGitCommand,
    getCurrentBranch,
    getRepoName,
    getRepoPath
} from "../util/util";

export async function pushRepo(repo: Repository, force: boolean = false): Promise<void> {
    const repoPath = getRepoPath(repo);

    if (!checkRepoExists(repo)) {
        throw new Error(`Repository not found: ${repoPath}`);
    }

    const args = ["push"];
    if (force) args.push("--force");

    const currentBranch = getCurrentBranch(repoPath);
    args.push("origin", currentBranch);

    console.log(`📤 Pushing ${getRepoName(repo.url)} (${currentBranch})...`);

    await execGitCommand(args, repoPath, { stdio: "inherit" });
}

export async function pushAll(
    repos: Repository[],
    concurrency: number,
    force: boolean = false
): Promise<void> {
    const { results, items } = await runWithConcurrency(
        repos,
        (repo) => pushRepo(repo, force),
        concurrency
    );

    const stats = formatResults(results, items, (r) => getRepoName(r.url));

    console.log(`\n📊 Push Summary:`);
    stats.details.forEach(line => console.log(line));
    console.log(`\n📈 Total: ${stats.success} succeeded, ${stats.failed} failed`);
}