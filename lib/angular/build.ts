import { runBin } from "../utils/run";
import { existsSync, readdirSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { resolvePath } from "../utils/dir";
import { registerErrorHandlers } from "@/lib/utils/error";
import { projectConfig } from "@/lib/config/module";
import { ensureIndexHtml } from "../utils/preset";

registerErrorHandlers();

const {
    web: {
        out: { dir: webOut },
    },
} = projectConfig();

/* ng 构建需要项目根 index.html，不存在时按 Angular 模板写入 */
await ensureIndexHtml(process.cwd(), "angular");

const result = runBin(
    "ng",
    ["build", ...process.argv.slice(2)],
    { cwd: process.cwd() },
    "@angular/cli",
);

/* ng build 失败时以相同状态码退出 */
if (result.status !== 0) process.exit(result.status ?? 1);

/* Angular application builder 的输出在 <web.out>/browser/ 下，摊平到 web.out */
const outDir: string = resolvePath(webOut),
    browserDir: string = join(outDir, "browser");

if (existsSync(browserDir)) {
    for (const name of readdirSync(browserDir)) {
        cpSync(join(browserDir, name), join(outDir, name), {
            recursive: true,
        });
    }
    rmSync(browserDir, { recursive: true, force: true });
    console.log(`📦 已摊平 Angular 产物: ${browserDir} → ${outDir}`);
}
