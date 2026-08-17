import type { Repository } from "./type";
import {
    checkRepoExists,
    execGitCommand,
    getRepoName,
    getRepoPath,
} from "./util";
import { formatResults, runWithConcurrency } from "./concurrency";

export async function statusRepo(repo: Repository): Promise<void> {
    const repoPath = getRepoPath(repo);

    if (!checkRepoExists(repo)) {
        throw new Error(`Repository not found: ${repoPath}`);
    }

    console.log(`\n📊 Status of ${getRepoName(repo.url)}:`);
    console.log("=".repeat(50));

    await execGitCommand(["status", "--short"], repoPath, { stdio: "inherit" });
}

export async function statusAll(
    repos: Repository[],
    concurrency: number,
): Promise<void> {
    const { results, items } = await runWithConcurrency(
        repos,
        statusRepo,
        concurrency,
    );

    const stats = formatResults(results, items, (r) => getRepoName(r.url));

    console.log(`\n📊 Status Summary:`);
    stats.details.forEach((line) => console.log(line));
    console.log(
        `\n📈 Total: ${stats.success} succeeded, ${stats.failed} failed`,
    );
}
