import { execSync } from "child_process";
import { chmodSync, existsSync, rmSync } from "fs";
import { resolve } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const targets: string[] = process.argv.slice(2);
targets.forEach(async (target) => {
    const targetPath: string = resolve(process.cwd(), target);
    if (existsSync(targetPath)) {
        try {
            // 尝试修改权限
            chmodSync(targetPath, 0o777);
            rmSync(targetPath, { recursive: true, force: true });
        } catch (error) {
            // 尝试使用 rimraf 作为备选方案
            execSync(`npx rimraf ${targetPath}`, { stdio: "inherit" });
        }
    }
});
