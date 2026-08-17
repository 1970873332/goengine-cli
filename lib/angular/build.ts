import { runBin } from "../utils/run";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

runBin(
    "ng",
    ["build", ...process.argv.slice(2)],
    { cwd: process.cwd() },
    "@angular/cli",
);
