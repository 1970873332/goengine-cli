import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";
import { ensureIndexHtml } from "../utils/preset";

registerErrorHandlers();

/* ng serve 需要项目根 index.html，不存在时按 Angular 模板写入 */
await ensureIndexHtml(process.cwd(), "angular");

/* Angular 专属：ng serve（Angular CLI 处理 AOT/linker，webpack/vite 的 JIT 不支持现代 Angular） */
runBin(
    "ng",
    ["serve", ...process.argv.slice(2)],
    { cwd: process.cwd() },
    "@angular/cli",
);
