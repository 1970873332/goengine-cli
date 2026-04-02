import { NetworkInterfaceInfo, networkInterfaces } from "os";

/**
 * IP 工具
 */
export class IPUtils {
    /**
     * 主机
     */
    public static host(): string | void {
        const interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> =
            networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            const iface: NetworkInterfaceInfo[] = interfaces[name] ?? [];
            for (const { family, address, internal } of iface) {
                if (family === "IPv4" && !internal && address !== "127.0.0.1") {
                    if (address.startsWith("192.168.")) {
                        return address;
                    }
                }
            }
        }
    }
}
