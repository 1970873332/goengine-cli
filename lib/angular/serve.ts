import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

/* Angular 专属：ng serve（Angular CLI 处理 AOT/linker，webpack/vite 的 JIT 不支持现代 Angular） */
runBin(
    "ng",
    ["serve", ...process.argv.slice(2)],
    { cwd: process.cwd() },
    "@angular/cli",
);
