export interface CommandSpec {
    name: string;
    aliases?: string[];
    description: string;
    /** 懒加载入口：字面量路径的动态导入，构建时会被拆成独立 chunk */
    load?: () => Promise<unknown>;
}

/**
 * 命令清单：名称 / 别名 / 描述 / 懒加载入口合并为单一来源，
 * 所有命令统一由 cli.ts 通过 runModule 执行。
 */
export const COMMANDS: CommandSpec[] = [
    {
        name: "create:web",
        description: "创建一个 Web 项目（React / Vue / Angular）",
        load: () => import("@/lib/create/web"),
    },
    {
        name: "electron:dev",
        description: "启动 Electron 开发环境",
        load: () => import("@/lib/electron/dev"),
    },
    {
        name: "electron:build",
        description: "构建 Electron 主进程与预加载脚本",
        load: () => import("@/lib/electron/build"),
    },
    {
        name: "electron:out",
        description: "打包 Electron 应用",
        load: () => import("@/lib/electron/out"),
    },
    {
        name: "web:serve",
        description: "启动 Webpack 开发服务器",
        load: () => import("@/lib/web/serve"),
    },
    {
        name: "web:build",
        description: "构建 Web 应用（Webpack）",
        load: () => import("@/lib/web/build"),
    },
    {
        name: "vite:serve",
        description: "启动 Vite 开发服务器",
        load: () => import("@/lib/web/vite.serve"),
    },
    {
        name: "vite:build",
        description: "构建 Web 应用（Vite）",
        load: () => import("@/lib/web/vite.build"),
    },
    {
        name: "ng:serve",
        description: "启动 Angular 开发服务器（ng serve）",
        load: () => import("@/lib/angular/serve"),
    },
    {
        name: "ng:build",
        description: "构建 Angular 应用（ng build）",
        load: () => import("@/lib/angular/build"),
    },
    {
        name: "service:serve",
        description: "启动服务端开发环境",
        load: () => import("@/lib/service/serve"),
    },
    {
        name: "service:build",
        description: "构建服务端应用",
        load: () => import("@/lib/service/build"),
    },
    {
        name: "git",
        description: "批量 Git 操作（clone / pull / push / status）",
        load: () => import("@/lib/git/index"),
    },
    {
        name: "format",
        description: "批量格式化子目录源码",
        load: () => import("@/lib/release/format"),
    },
    {
        name: "release:project",
        description: "汇总项目发布源码",
        load: () => import("@/lib/release/project"),
    },
    {
        name: "release:compose",
        description: "汇总项目发布产物",
        load: () => import("@/lib/release/compose"),
    },
    {
        name: "chii:serve",
        description: "启动 Chii 远程调试服务器",
        load: () => import("@/lib/debug/chii"),
    },
    {
        name: "install:all",
        description: "安装全部依赖（检测/安装 pnpm 并设置镜像）",
        load: () => import("@/lib/install"),
    },
    {
        name: "clean:modules",
        description: "清理 node_modules",
        load: () => import("@/lib/clean/modules"),
    },
];

/**
 * 运行一个 lib 模块。
 * lib 模块是"入口即执行"的脚本（顶层副作用 + 自己的 argv 解析），
 * 因此把进程 argv 还原成只含用户参数的形式后再动态导入。
 */
export async function runModule(
    load: () => Promise<unknown>,
    args: string[],
): Promise<void> {
    process.argv = [process.argv[0], "goengine", ...args];
    await load();
}
