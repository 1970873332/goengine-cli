import { Configuration } from "electron-builder";
import EngineConfig from "engine.config.json";
import { join } from "path";

const {
    lication: { name: appName, version: appVersion, id: appID },
    web: { build: webBuild },
    electron: {
        out: { dir },
        mirror,
        build: electronBuild,
    },
} = EngineConfig;

export function createConfig({
    name = appName,
    version = appVersion,
    id = appID,
}: Partial<PackageConfig>): Configuration {
    return {
        appId: id,
        productName: name,
        buildVersion: version,
        artifactName: name + ".${ext}",
        asar: true,
        npmRebuild: false,
        electronDownload: {
            mirror,
        },
        directories: {
            output: `${dir} ${Date.now()}`,
        },
        files: [
            "!node_modules",
            "!package.json",
            `${webBuild}/**/*`,
            `${electronBuild}/**/*`,
        ],
        win: {
            target: [
                {
                    target: "nsis",
                    arch: "x64",
                },
            ],
            icon: join(webBuild, "favicon.ico"),
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
            allowElevation: true
        },
    };
}
