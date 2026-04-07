import type { ElectrobunConfig } from "electrobun";

export default {
    app: {
        name: "GoEngine",
        identifier: "com.goengine",
        version: "0.1.0",
    },
    build: {
        useAsar: true,
        bun: {
            entrypoint: "preset/entry/Electrobun.ts",
        },
        views: {
            index: {
                entrypoint: "webs/hello-react/Main.tsx",
                minify: true,
            },
        }
    },
} satisfies ElectrobunConfig;