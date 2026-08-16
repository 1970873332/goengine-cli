import { chmodSync, existsSync, rmSync } from "fs";
import { resolve } from "path";
import { rimraf } from "rimraf";
import { registerErrorHandlers } from "@/lib/utils/Error";

registerErrorHandlers();

const targets: string[] = process.argv.slice(2);
for (const target of targets) {
    const targetPath: string = resolve(process.cwd(), target);
    if (existsSync(targetPath)) {
        try {
            // 尝试修改权限
            chmodSync(targetPath, 0o777);
            rmSync(targetPath, { recursive: true, force: true });
        } catch {
            // 尝试使用 rimraf 作为备选方案
            await rimraf(targetPath);
        }
    }
}
