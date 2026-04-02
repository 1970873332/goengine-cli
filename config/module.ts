import { IPUtils } from "@/lib/utils/IP";
import { normalPath } from "@/lib/utils/obtain/Dir";
import { scripts } from "@/package.json";
import { compilerOptions } from "@/tsconfig.json";

const { "serve:chii": serveChii } = scripts;

export const defaultAgreement: ModConfig["agreement"] = "http";

export function alias(): Record<string, string> {
    return Object.fromEntries(
        Object.entries(compilerOptions.paths).map(([key, value]) => {
            const reg: RegExp = /\/\*/;
            return [
                key.replace(reg, ""),
                value.map((item) => normalPath(item.replace(reg, "")))[0],
            ];
        }),
    );
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

export function chii(agreement: ModConfig["agreement"]): Record<string, unknown> {
    return {
        enable: true,
        server: `${agreement}://${IPUtils.host()}:${serveChii.match(/-p\s+(\d+)/)?.[1]}`,
    };
}

export function isHTTPS(agreement: ModConfig["agreement"]): boolean {
    return agreement === "https";
}

export function useNODE_ENV(value: string): string {
    return `NODE_ENV=${value}`;
}

export function useAGREEMENT(value: ModConfig["agreement"]): string {
    return `USE_AGREEMENT=${value}`;
}

export function useHOST(value: ModConfig["host"]): string {
    return `USE_HOST=${value}`;
}

export function usePORT(value: ModConfig["port"]): string {
    return `USE_PORT=${value}`;
}