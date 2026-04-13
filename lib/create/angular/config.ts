import { normalPath } from "@/lib/utils/obtain/Dir";
import { selectTarget } from "@/lib/utils/Select";
import { writeFileSync } from "fs";
import { userData } from "package.json";
import { join, relative } from "path";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const
    dev: boolean = process.env.NODE_ENV === "development",
    {
        app: { web },
        web: { build },
        tsconfig: { index, angular },
        html: { angular: angular_html },
    } = userData,
    [filePath, path]: string[] = await selectTarget(web, "Main"),
    projectPath: string = relative(process.cwd(), path),
    project: string = relative(web, projectPath);

const
    angularTSConfig = {
        extends: normalPath(index),
        compilerOptions: {
            declaration: false,
            declarationDir: null
        },
        include: [
            join(projectPath, "**/*.ts")
        ]
    }, angularConfig = {
        version: 1,
        cli: {
            analytics: false,
            schematicCollections: ["@angular-devkit/build-angular"]
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
                                output: process.env.OUTPUT_HTML || "index.html"
                            },
                            main: relative(process.cwd(), filePath),
                            tsConfig: angular,
                            optimization: dev,
                            buildOptimizer: dev,
                        }
                    },
                    serve: {
                        builder: "@angular-devkit/build-angular:dev-server",
                        options: {
                            buildTarget: `${project}:build`
                        }
                    }
                }
            }
        }
    };

const configPath: string = normalPath("angular.json"),
    tsConfigPath: string = normalPath(angular);
// 写入 tsconfig.angular.json
writeFileSync(tsConfigPath, JSON.stringify(angularTSConfig, null, 2));
// 写入 angular.json（Angular CLI 默认从根目录读取）
writeFileSync(configPath, JSON.stringify(angularConfig, null, 2));