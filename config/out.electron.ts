import { userData } from "@/package.json";
import { Configuration } from "electron-builder";
import { join } from "path";

const {
    web: { build: webBuild },
    electron: { dist, mirror, build: electronBuild },
} = userData;

export function createConfig({
    name = "GoEngine",
    version = "0.1.0",
    packageID = "com.goengine",
}: Partial<PackageConfig>): Configuration {
    return {
        appId: packageID,
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
            fileAssociations: [
                {
                    ext: "exe",
                    name: name,
                },
            ],
            icon: join(webBuild, "favicon.ico"),
        },
        nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: false,
            perMachine: true,
        },
    };
}
