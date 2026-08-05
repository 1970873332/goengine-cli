import { formatResults, runWithConcurrency } from "../util/concurrency";
import type { Repository } from "../type";
import {
    checkRepoExists,
    execGitCommand,
    getRepoName,
    getRepoPath,
} from "../util/util";

export async function pullRepo(repo: Repository): Promise<void> {
    const repoPath = getRepoPath(repo);

    if (!checkRepoExists(repo)) {
        throw new Error(`Repository not found: ${repoPath}`);
    }

    const args = ["pull"];
    if (repo.branch) {
        args.push("origin", repo.branch);
    }

    console.log(`📥 Pulling ${getRepoName(repo.url)}...`);

    await execGitCommand(args, repoPath, { stdio: "inherit" });
}

export async function pullAll(
    repos: Repository[],
    concurrency: number,
): Promise<void> {
    const { results, items } = await runWithConcurrency(
        repos,
        pullRepo,
        concurrency,
    );

    const stats = formatResults(results, items, (r) => getRepoName(r.url));

    console.log(`\n📊 Pull Summary:`);
    stats.details.forEach((line) => console.log(line));
    console.log(
        `\n📈 Total: ${stats.success} succeeded, ${stats.failed} failed`,
    );
}
