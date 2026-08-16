import { resolvePath } from "@/lib/utils/obtain/dir";
import { selectEntryFile } from "@/lib/utils/select";
import EngineConfig from "@/engine.config.json";
import { mkdirSync, writeFileSync } from "fs";
import { readdir } from "fs/promises";
import { dirname, join, relative } from "path";
import { registerErrorHandlers } from "@/lib/utils/error";

registerErrorHandlers();

const configFilename: string = "angular.json",
    dev: boolean = process.env.NODE_ENV === "development",
    {
        app: { web },
        web: { out },
        tsconfig: { root, angular },
        html: { angular: angular_html },
    } = EngineConfig,
    { filePath, projectPath: projectDir } = await selectEntryFile(
        web,
        "main",
    );

if (
    !(await readdir(projectDir, { withFileTypes: true })).some(
        (item) => item.isFile() && /^app\.component\./.test(item.name),
    )
)
    throw new Error("❌ 所选项目不是 Angular 项目（根目录缺少 app.component 文件）");

const projectPath: string = relative(process.cwd(), projectDir),
    project: string = relative(web, projectPath),
    configPath: string = resolvePath(configFilename),
    tsConfigPath: string = resolvePath(angular),
    tsconfigDir: string = dirname(tsConfigPath);

const angularTSConfig = {
        extends: resolvePath(root),
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
                            outputPath: out,
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
                            styles: ["package/goengine-web/src/css/index.css"],
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
