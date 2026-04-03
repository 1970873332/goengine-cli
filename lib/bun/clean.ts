import { existsSync, rmSync } from "fs";
import { resolve } from "path";

const targets: string[] = process.argv.slice(2);
targets.forEach(target => {
    const targetPath: string = resolve(process.cwd(), target);
    existsSync(targetPath) && rmSync(targetPath, { recursive: true, force: true });
});