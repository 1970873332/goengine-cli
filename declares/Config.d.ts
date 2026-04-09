import { Configuration } from "webpack-dev-server";

declare global {
    /**
     * 项目
     */
    interface Project {
        /**
         * 包
         */
        package?: Partial<Record<Modules, PackageConfig>>;
        /**
         * 模块
         */
        mod?: ModConfig;
    }

    /**
     * 包配置
     */
    interface PackageConfig {
        /**
         * 名称
         */
        name?: string;
        /**
         * 版本号
         */
        version?: string;
        /**
         * ID
         */
        id?: string;
    }

    /**
     * 模块配置
     */
    interface ModConfig {
        /**
         * 协议
         */
        agreement?: "http" | "https";
        /**
         * 主机
         */
        host?: string;
        /**
         * 端口
         */
        port?: number;
        /**
         * 备注
         */
        remarks?: string;
        /**
         * 是否启用调试模式
         * @description 生产环境下关闭此选项，以避免后门/调试程序暴露
         */
        debug?: boolean;
        /**
         * 是否在构建时启用依赖分析
         */
        inspector?: boolean;
        /**
         * 是否合并包
         * @description true  : 动态导入模块单独打包，其余模块/样式表分别合并打包
         * @description false : 模块按照依赖拆分为独立文件
         * @description 对于依赖较大的推荐不合并，每次更新只需要上传入口文件即可。
         *              反之则合并，以减少文件请求次数。
         */
        mergePackage?: boolean;
        /**
         * 是否为模块模式
         * @description 模块模式下输出的文件会被打包成模块以供导入
         * @description 非模块模式下输出的文件会被打包成自执行函数
         */
        module?: boolean;
        /**
         * 本地代理
         */
        proxy?: Configuration["proxy"];
    }

    type Modules = "electron";
}

export {};
