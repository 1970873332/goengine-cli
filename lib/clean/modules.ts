import { workspaces } from "@/package.json";
import { execSync } from "child_process";
import { join } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const dir: string = "node_modules",
    command: string = workspaces.map((item) => join(item, dir)).join(" ");

execSync(`rimraf ${command} && rimraf ${dir}`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: process.cwd(),
});
