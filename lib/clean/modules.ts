import { useBun } from "@/config/module";
import { workspaces } from "@/package.json";
import { execSync } from "child_process";
import { join } from "path";
import { sync } from "fast-glob";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const modules: string = "node_modules",
    command: string = workspaces
        .flatMap((pattern) => sync(pattern, { onlyDirectories: true }))
        .map((dir) => join(dir, modules))
        .join(" ");

execSync(`${useBun()} "rimraf ${command} ${modules}"`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
