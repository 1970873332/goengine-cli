import type { Config } from "./type";

export const config: Config = {
    targetDir: "package",
    goal: "https://github.com/1970873332/",
    parallel: 3,
    repositories: [
        { url: "goengine-core.git" },
        { url: "goengine-web.git" },
        { url: "goengine-service.git" },
        { url: "goengine-vue.git" },
        { url: "goengine-react.git" },
        { url: "goengine-angular.git" },
        { url: "goengine-webgl.git" },
        { url: "goengine-canvas.git" },
        { url: "goengine-electron.git" },
        { url: "goengine-electrobun.git" },
    ],
};