import type { PreloadClass } from "@electron/preload/Index";

declare global {
    /**
     * 引擎
     */
    var GoEngine: PreloadClass | undefined;
    /**
     * 设备状态
     */
    var DeviceState: Record<any, boolean> | undefined;
    /**
     * 环境
     */
    var __NODE_ENV__: NodeJS.ProcessEnv["NODE_ENV"] | undefined;
    /**
     * 调试
     */
    var __DEBUG__: "true" | "false" | undefined;

    /**
     * 窗口
     */
    interface Window {
        /**
         * 设备传感器事件
         */
        DeviceOrientationEvent: {
            requestPermission?(): Promise<PermissionState>;
        };
        /**
         * 发送消息
         * @param message
         * @param targetOrigin
         * @param transfer
         */
        postMessage<T>(
            message: T,
            targetOrigin?: string,
            transfer?: Transferable[],
        ): void;
    }
}

export {};
