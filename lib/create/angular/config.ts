import { normalPath } from "@/lib/utils/obtain/Dir";
import { selectTarget } from "@/lib/utils/Select";
import { mkdirSync, writeFileSync } from "fs";
import { userData } from "package.json";
import { dirname, join, relative } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const json: string = "angular.json",
    dev: boolean = process.env.NODE_ENV === "development",
    {
        app: { web },
        web: { build },
        tsconfig: { index, angular },
        html: { angular: angular_html },
    } = userData,
    [filePath, path]: string[] = await selectTarget(web, "main"),
    projectPath: string = relative(process.cwd(), path),
    project: string = relative(web, projectPath),
    configPath: string = normalPath(json),
    tsConfigPath: string = normalPath(angular),
    tsconfigDir: string = dirname(tsConfigPath);

const angularTSConfig = {
        extends: normalPath(index),
        compilerOptions: {
            declaration: false,
            declarationDir: null,
        },
        include: [join(relative(tsconfigDir, projectPath), "**/*.ts")],
    },
    angularConfig = {
        version: 1,
        cli: {
            analytics: false,
            schematicCollections: ["@angular-devkit/build-angular"],
        },
        projects: {
            [project]: {
                projectType: "application",
                root: "",
                architect: {
                    build: {
                        builder: "@angular-devkit/build-angular:browser",
                        options: {
                            outputPath: build,
                            index: {
                                input: angular_html,
                                output: process.env.OUTPUT_HTML || "index.html",
                            },
                            main: relative(process.cwd(), filePath),
                            tsConfig: angular,
                            optimization: dev,
                            buildOptimizer: dev,
                            assets: [
                                {
                                    glob: "**/*",
                                    input: "public",
                                    output: "/",
                                },
                            ],
                            styles: ["package/web/src/css/index.css"],
                        },
                    },
                    serve: {
                        builder: "@angular-devkit/build-angular:dev-server",
                        options: {
                            buildTarget: `${project}:build`,
                        },
                    },
                },
            },
        },
    };

// 创建目录
mkdirSync(tsconfigDir, { recursive: true });
// 写入 tsconfig.angular.json
writeFileSync(tsConfigPath, JSON.stringify(angularTSConfig, null, 2));
// 创建目录
mkdirSync(dirname(configPath), { recursive: true });
// 写入 angular.json（Angular CLI 默认从根目录读取）
writeFileSync(configPath, JSON.stringify(angularConfig, null, 2));
