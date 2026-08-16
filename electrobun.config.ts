import type { ElectrobunConfig } from "electrobun";
import EngineConfig from "@/engine.config.json";

const {
    application: { name, version, id: identifier },
    electrobun: { input },
} = EngineConfig;

export default {
    app: {
        name,
        version,
        identifier,
    },
    build: {
        bun: {
            entrypoint: input,
        },
    },
} satisfies ElectrobunConfig;
