declare global {
    /**
     * WebGL
     */
    namespace WebGL {
        /**
         * 着色器
         */
        type Shader<T> = {
            /**
             * 着色器ID
             */
            id: string;
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
     * 向量对象
     */
    namespace VectorObject {
        /**
         * 二维向量
         */
        type Vector2 = {
            x: number;
            y: number;
        };
        /**
         * 三维向量
         */
        type Vector3 = Vector2 & {
            z: number;
        };
        /**
         * 四维向量
         */
        type Vector4 = Vector3 & {
            w: number;
        };

        /**
         * 二维向量尺寸
         */
        type Vector2Size = {
            width: number;
            height: number;
        };
        /**
         * 三维向量尺寸
         */
        type Vector3Size = Vector2Size & {
            depth: number;
        };
        /**
         * 四维向量尺寸
         */
        type Vector4Size = Vector3Size & {
            layer: number;
        };

        /**
         * 二维向量颜色
         */
        type Vector2Color = {
            color: number | string;
            alpha: number;
        };
        /**
         * 三维向量颜色
         */
        type Vector3Color = {
            r: number;
            g: number;
            b: number;
        };
        /**
         * 四维向量颜色
         */
        type Vector4Color = Vector3Color & {
            a: number;
        };
    }

    /**
     * 向量属性
     */
    namespace VectorAttr {
        /**
         * 二维向量
         */
        type Vector2 = Partial<VectorObject.Vector2> &
            Partial<VectorObject.Vector2Size>;

        /**
         * 三维向量
         */
        type Vector3 = Vector2 &
            Partial<VectorObject.Vector3> &
            Partial<VectorObject.Vector3Size> &
            Partial<VectorObject.Vector3Color>;

        /**
         * 四维向量
         */
        type Vector4 = Vector3 &
            Partial<VectorObject.Vector4> &
            Partial<VectorObject.Vector4Size> &
            Partial<VectorObject.Vector4Color>;
    }

    /**
     * Canvas
     */
    namespace Canvas {
        /**
         * 2D上下文
         */
        type Context2D =
            CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        /**
         * WebGL上下文
         */
        type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;
        /**
         * 上下文
         */
        type Context = CanvasContext2D | WebGLContext | GPUCanvasContext;
        /**
         * 上下文类型
         */
        type ContextType = "2d" | "webgl" | "webgl2" | "webgpu";

        /**
         * 模板
         */
        interface TemplateMap {}
        /**
         * 路径
         */
        interface PathMap {}
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
            ENV_PROTOCOL?: ModConfig["protocol"];
            /**
             * 主机
             */
            ENV_HOST?: ModConfig["host"];
            /**
             * 端口
             */
            ENV_PORT?: string;
        }
    }
}

export {};
