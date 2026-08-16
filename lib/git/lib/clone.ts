import { formatResults, runWithConcurrency } from "../util/concurrency";
import { config } from "../repositories";
import type { Repository } from "../type";
import {
    buildGitUrl,
    ensureTargetDir,
    execGitCommand,
    getRepoName,
} from "../util/util";

export async function cloneRepo(repo: Repository): Promise<void> {
    const { baseUrl, targetDir } = config;
    const { url, branch } = repo;

    const fullUrl = buildGitUrl(url, baseUrl);
    ensureTargetDir();

    const args = ["clone", "--progress"];
    if (branch) args.push("-b", branch);
    args.push(fullUrl);

    console.log(`📦 Cloning ${getRepoName(url)}...`);

    await execGitCommand(args, targetDir, {
        stdio: "pipe",
        showProgress: true,
    });
}

export async function cloneAll(
    repos: Repository[],
    concurrency: number,
): Promise<void> {
    const { results, items } = await runWithConcurrency(
        repos,
        cloneRepo,
        concurrency,
    );

    const stats = formatResults(results, items, (r) => getRepoName(r.url));

    console.log(`\n📊 Clone Summary:`);
    stats.details.forEach((line) => console.log(line));
    console.log(
        `\n📈 Total: ${stats.success} succeeded, ${stats.failed} failed`,
    );
}
