import type { ElectrobunConfig } from "electrobun";
import { userData } from "package.json";

const {
    lication: { name, version, id: identifier },
    electrobun: { input },
} = userData;

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
