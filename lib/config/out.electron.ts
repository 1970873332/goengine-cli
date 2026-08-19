import { Configuration } from "electron-builder";
import { join } from "path";
import { NODE_MODULES, PACKAGE_JSON, projectConfig } from "./module";

const {
    static: { favicon },
    web: {
        out: { dir: webOut },
    },
    electron: {
        out: { dir },
        mirror,
        build: electronBuild,
    },
} = projectConfig();

/** 打包身份（name / version / id）由调用方从项目 package.json 组装传入 */
export function createConfig({
    name,
    version,
    id,
}: {
    name: string;
    version: string;
    id: string;
}): Configuration {
    return {
        appId: id,
        productName: name,
        buildVersion: version,
        artifactName: name + ".${ext}",
        asar: true,
        /* 依赖已由 esbuild / webpack 打入产物，node_modules 不随包分发；
         * beforeBuild 返回 false 让 electron-builder 跳过依赖树收集与重建，
         * 避免对未安装到项目内的框架依赖（react/vue 等）报 production dependency not found */
        beforeBuild: () => false,
        electronDownload: {
            /* ELECTRON_MIRROR 环境变量优先，其次 engine.config.json，缺省走官方源 */
            mirror: process.env.ELECTRON_MIRROR ?? mirror,
        },
        directories: {
            output: dir,
        },
        files: [
            `!${NODE_MODULES}`,
            `!${PACKAGE_JSON}`,
            `${webOut}/**/*`,
            `${electronBuild}/**/*`,
        ],
        win: {
            target: [
                {
                    target: "nsis",
                    arch: "x64",
                },
            ],
            icon: join(webOut, favicon),
        },
        nsis: {
            // 一键安装
            oneClick: false,
            // 修改安装目录
            allowToChangeInstallationDirectory: true,
            // 创建到桌面
            createDesktopShortcut: true,
            // 创建到开始菜单
            createStartMenuShortcut: false,
            // 为每台机器安装
            perMachine: true,
            // 提升权限
            allowElevation: true,
        },
    };
}
