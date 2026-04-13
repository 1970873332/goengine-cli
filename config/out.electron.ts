import { userData } from "package.json";
import { Configuration } from "electron-builder";
import { join } from "path";

const {
    lication: { name: appName, version: appVersion, id: appID },
    web: { build: webBuild },
    electron: { dist, mirror, build: electronBuild },
} = userData;

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
            output: `${dist} ${Date.now()}`,
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
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: false,
            perMachine: false,
        },
    };
}
