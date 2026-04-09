import { copy } from "@/lib/utils/FS";
import { userData } from "@/package.json";
import { join } from "path";
import { defineConfig } from "tsup";

const { out } = userData;

export default defineConfig([
    {
        entry: ["package/service/src/**/*.ts"],
        outDir: join(out, "service"),
        dts: false,
        clean: true,
        bundle: false,
        splitting: false,
        format: ["esm", "cjs"],
        platform: "node",
        target: "node16",
    },
    {
        entry: ["package/web/src/**/*.{ts,tsx}"],
        outDir: join(out, "web"),
        dts: false,
        clean: true,
        bundle: false,
        splitting: false,
        format: "esm",
        platform: "browser",
        target: "esnext",
        esbuildPlugins: [
            {
                name: "config-copy-plugin",
                setup(build) {
                    build.onEnd(async () => {
                        await copy("package/web/src/css", join(out, "web"));
                    });
                },
            },
        ],
    },
    {
        entry: [
            "package/electron/src/**/*.ts",
            "!package/electron/src/preload/**/*",
        ],
        outDir: join(out, "electron"),
        dts: false,
        clean: true,
        bundle: false,
        splitting: false,
        format: "esm",
        platform: "node",
        target: "node16",
    },
    {
        entry: ["package/electron/src/preload/**/*.ts"],
        outDir: join(out, "electron/preload"),
        dts: false,
        clean: true,
        bundle: false,
        splitting: false,
        format: "cjs",
        platform: "node",
        target: "node16",
    },
]);
