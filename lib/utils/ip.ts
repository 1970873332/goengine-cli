import { NetworkInterfaceInfo, networkInterfaces } from "os";

export class IPUtils {
    /** 获取本机局域网 IPv4（192.168.x） */
    public static ip(): string | void {
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
