import { IPUtils } from "@/lib/utils/ip";
import { resolvePath } from "@/lib/utils/dir";

/** Chii 远程调试服务器默认端口（chii:serve 命令与调试地址共用） */
export const CHII_PORT = 3000;

export const defaultProtocol: ModConfig["protocol"] = "http";

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

export function envNODE_ENV(value: string): string {
    return `NODE_ENV=${value}`;
}

export function envPROTOCOL(value: ModConfig["protocol"]): string {
    return `ENV_PROTOCOL=${value}`;
}

export function envHOST(value: ModConfig["host"]): string {
    return `ENV_HOST=${value}`;
}

export function envPORT(value: ModConfig["port"]): string {
    return `ENV_PORT=${value}`;
}
