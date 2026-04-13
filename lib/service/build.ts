import { createConfig } from "@/config/esbuild";
import { userData } from "package.json";
import { BuildOptions, build as esBuild } from "esbuild";
import { join } from "path";
import { selectTarget } from "../utils/Select";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { service },
        service: { build, out },
    } = userData,
    [filePath]: string[] = await selectTarget(service, "Main"),
    config: BuildOptions = {
        ...createConfig(
            [filePath],
            normalPath(join(`${build} ${Date.now()}`, out)),
        ),
        packages: "external",
    };

console.log("🚀 开始构建 Service ...");
esBuild(config);
