import type { ElectrobunConfig } from "electrobun";
import { userData } from "./package.json";

const {
    electrobun: { input },
} = userData;

export default {
    app: {
        name: "GoEngine",
        identifier: "com.goengine",
        version: "0.1.0",
    },
    build: {
        bun: {
            entrypoint: input,
        },
    },
} satisfies ElectrobunConfig;
