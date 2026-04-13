import { userData } from "package.json";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { generate, GenerateResult } from "selfsigned";
import { normalPath } from "./obtain/Dir";

/**
 * SSL 证书工具
 */
export class SSLUtils {
    /**
     * 证书存放目录
     */
    private static readonly dir: string = userData.ssl.static;
    /**
     * 证书存放路径
     */
    private static readonly url: string = normalPath(this.dir);

    /**
     * 获取证书文件路径
     * @param name
     * @returns
     */
    public static obtainFilePath(name?: string): {
        keyPath: string;
        certPath: string;
    } {
        return {
            keyPath: resolve(this.url, `${name}.key`),
            certPath: resolve(this.url, `${name}.crt`),
        };
    }
    /**
     * 获取证书文件路径
     * @param name
     */
    public static obtainFilePathTransKey<T extends Record<string, any>>(
        name: string,
        key: keyof T,
        cert: keyof T,
    ): {
        [key]: string;
        [cert]: string;
    } {
        const { keyPath, certPath } = this.obtainFilePath(name);
        return {
            [key]: keyPath,
            [cert]: certPath,
        };
    }
    /**
     * 获取证书
     * @param name
     * @returns
     */
    public static async obtain(name: string): Promise<string> {
        const { keyPath, certPath } = this.obtainFilePath(name);

        /* 检查证书 */
        console.log(`🔍 检查SSL证书: ${name}`);
        if (existsSync(certPath) && existsSync(keyPath)) return name;

        await this.create(name);

        return name;
    }
    /**
     * 创建自签名证书
     * @param name
     */
    public static async create(name: string): Promise<void> {
        const { keyPath, certPath } = this.obtainFilePath(name);

        return new Promise<void>((resolvePromise, rejectPromise) => {
            console.log(`🔑 生成自签名SSL证书: ${name}`);
            generate(
                void 0,
                void 0,
                (error: unknown, result: GenerateResult) => {
                    if (error) throw rejectPromise(error);

                    if (!existsSync(this.url)) {
                        console.log(`📁 创建证书存放目录: ${this.url}`);
                        mkdirSync(this.url, { recursive: true });
                    }

                    writeFileSync(keyPath, result.private);
                    writeFileSync(certPath, result.cert);

                    console.log("✅ SSL 证书生成成功！");
                    console.log("   🔑 私钥:", keyPath);
                    console.log("   📜 证书:", certPath);

                    resolvePromise();
                },
            );
        });
    }
}
