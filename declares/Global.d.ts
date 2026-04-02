declare global {
    /**
     * GLSL
     */
    namespace GLSL {
        /**
         * WebGL上下文
         */
        type WebGLAllRenderingContext =
            | WebGLRenderingContext
            | WebGL2RenderingContext;
        /**
         * 着色器
         */
        type Shader<T> = {
            /**
             * 顶点着色器
             */
            vertex: T;
            /**
             * 片段着色器
             */
            fragment: T;
        };
    }

    /**
     * NodeJS
     */
    namespace NodeJS {
        /**
         * process.env
         */
        interface ProcessEnv {
            /**
             * node环境
             */
            NODE_ENV?: "development" | "production";
            /**
             * 协议
             */
            USE_AGREEMENT?: ModConfig["agreement"];
            /**
             * 主机
             */
            USE_HOST?: ModConfig["host"];
            /**
             * 端口
             */
            USE_PORT?: ModConfig["port"];
        }
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
}

export { };
