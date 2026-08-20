import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";
import { ensureIndexHtml } from "../utils/preset";

registerErrorHandlers();

/* ng serve 需要项目根 index.html，不存在时按 Angular 模板写入 */
await ensureIndexHtml(process.cwd(), "angular");

/* Angular 由 ng CLI 构建（AOT/linker 依赖 ng 工具链） */
runBin(
    "ng",
    ["serve", ...process.argv.slice(2)],
    { cwd: process.cwd() },
    "@angular/cli",
);
