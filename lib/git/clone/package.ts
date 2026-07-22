import { execSync, spawn } from "child_process";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

interface Config {
    targetDir: string;
    goal: string;
    repositories: Repository[];
}

interface Repository {
    url: string;
    branch?: string;
}

// 配置
const config: Config = {
    targetDir: "package",
    goal: "https://github.com/1970873332/",
    repositories: [
        { url: "goengine-core.git" },

        { url: "goengine-web.git" },
        { url: "goengine-service.git" },

        { url: "goengine-vue.git" },
        { url: "goengine-react.git" },
        { url: "goengine-angular.git" },

        { url: "goengine-webgl.git" },
        { url: "goengine-canvas.git" },

        { url: "goengine-electron.git" },
        { url: "goengine-electrobun.git" },
    ],
};

function cloneRepo(options: Repository): Promise<void> {
    const { goal, targetDir } = config,
        { url, branch } = options,
        pattern: RegExp = /^(https?:\/\/|git@|ssh:\/\/|git:\/\/)/i;

    let pattenrUrl: string = url;

    if (!pattern.test(url)) {
        pattenrUrl = new URL(url, goal).toString();
    }

    return new Promise((resolve, reject) => {
        const args = ["clone"];

        if (branch) args.push("-b", branch);

        args.push(pattenrUrl);

        const gitProcess = spawn("git", args, {
            stdio: "inherit",
            cwd: targetDir,
        });

        gitProcess.on("close", (code: number) => {
            if (code === 0) resolve();
            else reject(new Error(`git clone failed with code ${code}`));
        });

        gitProcess.on("error", reject);
    });
}

const checkGit = () => {
    try {
        return (execSync("git --version", { stdio: "ignore" }), true);
    } catch {
        return false;
    }
};

if (!checkGit())
    throw new Error("❌ Git is not installed or not available in PATH");

const results = await Promise.allSettled(config.repositories.map(cloneRepo));

results.forEach((result, index) => {
    const repo = config.repositories[index];

    if (result.status === "fulfilled") {
        console.log(`✅ Success: ${repo.url}`);
    } else {
        console.log(`❌ Failed: ${repo.url}`);
    }
});
