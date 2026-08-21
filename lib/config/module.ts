import { existsSync, readFileSync } from "fs";
import { join } from "path";
import EngineConfig from "@/engine.config.json";
import { IPUtils } from "@/lib/utils/ip";
import { resolvePath } from "@/lib/utils/dir";

/** 常用文件名常量（集中定义，避免各处硬编码） */
export const NODE_MODULES: string = "node_modules";
export const PACKAGE_JSON: string = "package.json";
export const ENGINE_CONFIG_JSON: string = "engine.config.json";
export const TSCONFIG_JSON: string = "tsconfig.json";
/** Web 入口文件固定约定（angular / vite 使用，不参与配置） */
export const INDEX_HTML: string = "index.html";
/** 正则字符类：匹配 Windows 反斜杠与正斜杠（模板插值时统一用它，避免转义回归） */
export const REGEXP_PATH_SEPARATOR: string = "[\\\\/]";
/** dev server 默认值（Project.ts 未配置时兜底） */
export const DEFAULT_HOST: string = "localhost";
export const DEFAULT_PORT: number = 8080;

/** 递归深合并（对象递归合并，其余以 override 为准） */
function mergeConfig<T>(base: T, override: unknown): T {
    if (
        typeof base === "object" &&
        base !== null &&
        !Array.isArray(base) &&
        typeof override === "object" &&
        override !== null &&
        !Array.isArray(override)
    ) {
        const result: Record<string, unknown> = {
            ...(base as Record<string, unknown>),
        };
        for (const [key, value] of Object.entries(
            override as Record<string, unknown>,
        )) {
            result[key] = mergeConfig(result[key], value);
        }
        return result as T;
    }
    return override as T;
}

/** 项目 engine.config.json（若存在）与 CLI 默认深合并，项目优先；缺失时返回 CLI 默认 */
export function projectConfig(): typeof EngineConfig {
    const file: string = join(process.cwd(), ENGINE_CONFIG_JSON);
    return existsSync(file)
        ? mergeConfig(EngineConfig, JSON.parse(readFileSync(file, "utf8")))
        : EngineConfig;
}

/** Chii 远程调试服务器默认端口（chii:serve 命令与调试地址共用） */
export const CHII_PORT: number = EngineConfig.chii.port;

export const defaultProtocol: "http" | "https" = "http";

export function alias(): Record<string, string> {
    return {
        "@": resolvePath(process.cwd()),
    };
}

export function define(debug: boolean): Record<string, string> {
    return {
        __DEBUG__: `"${String(debug)}"`,
        __NODE_ENV__: `"${String(process.env.NODE_ENV)}"`,
    };
}

export function extensions(): string[] {
    return [".ts", ".js", ".tsx", ".jsx", ".vue", ".wk"];
}

export function chii(protocol: ModConfig["protocol"]): Record<string, unknown> {
    return {
        enable: true,
        server: `${protocol}://${IPUtils.ip()}:${CHII_PORT}`,
    };
}

export function isHTTPS(protocol: ModConfig["protocol"]): boolean {
    return protocol === "https";
}
