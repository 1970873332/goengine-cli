import { BuildOptions } from "esbuild";
import { alias } from "./module";

export function createConfig(
    entry: BuildOptions["entryPoints"],
    output: string,
    externalNode?: boolean,
): BuildOptions {
    return {
        entryPoints: entry,
        outfile: output,
        bundle: true,
        minify: true,
        sourcemap: false,
        platform: "node",
        target: "node16",
        format: externalNode ? "cjs" : "esm",
        alias: alias(),
        loader: {
            ".ts": "ts",
            ".json": "json",
        },
    };
}
