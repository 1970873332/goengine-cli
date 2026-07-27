import type { PreloadClass } from "@goengine/electron/preload/Index";

declare global {
    /**
     * 引擎
     */
    var GoEngine: PreloadClass | undefined;
    /**
     * 设备状态
     */
    var DeviceState: Partial<Record<keyof Device, boolean>> | undefined;
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

    /**
     * 文档
     */
    interface Document {
        readonly webkitFullscreenElement?: Element;
        readonly mozFullScreenElement?: Element;
        readonly msFullscreenElement?: Element;
        webkitExitFullscreen?(): Promise<void>;
        mozCancelFullScreen?(): Promise<void>;
        msExitFullscreen?(): Promise<void>;
    }

    /**
     * HTML文档
     */
    interface HTMLElement {
        webkitRequestFullscreen?(): Promise<void>;
        mozRequestFullScreen?(): Promise<void>;
        msRequestFullscreen?(): Promise<void>;
    }

    /**
     * 设备状态
     */
    interface Device {
        /**
         * 是否桌面端
         */
        desktop: boolean;
        /**
         * 是否移动端
         */
        mobile: boolean;
        /**
         * 是否Pad端
         */
        pad: boolean;
        /**
         * 是否IOS设备
         */
        ios: boolean;
        /**
         * 是否安卓设备
         */
        android: boolean;
        /**
         * 是否微信环境
         */
        wechat: boolean;
        /**
         * 是否横屏
         */
        landscape: boolean;
    }
}

export {};
