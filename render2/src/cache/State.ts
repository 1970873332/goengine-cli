import { AttributeKey } from "../GLSL";
import { BaseGeometryAttribute } from "../geometry/Base";
import WeakMapCache from "./base/WeakMap";

/**
 * 状态缓存
 */
export default class StateCache extends WeakMapCache<WebGLProgram, IState> {
    /**
     * 纹理单元
     */
    public unit: number = 0;
    /**
     * 当前各纹理单元绑定的纹理（全局，避免重复 bindTexture）
     */
    public readonly textures = new Map<number, WebGLTexture>();
    /**
     * 最大纹理单元
     */
    public maxUnit?: number;

    /**
     * 下一个纹理单元
     */
    public get nextUnit(): number {
        return (
            (this.unit + 1) %
            (this.maxUnit ??= this.gl.getParameter(
                this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
            ))
        );
    }

    /**
     * 分配
     * @param program
     */
    public allocate(program: WebGLProgram): IState {
        if (this.has(program)) return this.get(program)!;
        const state: IState = {
            buffer: {
                location: {
                    uv: this.gl.getAttribLocation(program, AttributeKey.uv),
                    normal: this.gl.getAttribLocation(
                        program,
                        AttributeKey.normal,
                    ),
                    position: this.gl.getAttribLocation(
                        program,
                        AttributeKey.position,
                    ),
                },
            },
            uniform: {
                location: {},
                // 当前程序不存在的 uniform（缺失时静默跳过，避免每帧刷警告）
                missing: new Set(),
                // 已上传视图/投影矩阵的帧号与相机（每程序每帧只上传一次）
                viewFrame: -1,
                viewCamera: undefined,
            },
            texture: {
                // uniform 名 -> 纹理绑定（单元号复用）
                bindings: new Map(),
                // 该程序已占用的纹理单元
                units: new Set(),
            }
        };
        this.set(program, state);
        return state;
    }
    /**
     * 纹理单元步进
     */
    public stepUnit(): number {
        return (this.unit = this.nextUnit);
    }
}

interface IState {
    /**
     * 缓冲区
     */
    buffer: IBuffer;
    /**
     * uniform
     */
    uniform: IUniform;
    /**
     * 纹理
     */
    texture: ITexture;
}

interface IBuffer {
    /**
     * 位置
     */
    location: TLocation;
}

interface IUniform {
    /**
     * 位置
     */
    location: Record<string, WebGLUniformLocation>;
    /**
     * 缺失的 uniform
     */
    missing: Set<string>;
    /**
     * 已上传视图/投影矩阵的帧号
     */
    viewFrame: number;
    /**
     * 已上传视图/投影矩阵的相机
     */
    viewCamera?: object;
}

interface ITexture {
    /**
     * uniform 名 -> 纹理绑定
     */
    bindings: Map<string, ITextureBinding>;
    /**
     * 已占用的纹理单元
     */
    units: Set<number>;
}

interface ITextureBinding {
    /**
     * 纹理
     */
    texture: WebGLTexture;
    /**
     * 单元
     */
    unit: number;
}

type TLocation = {
    [K in keyof BaseGeometryAttribute]: number;
} & {
    [key: string]: number;
};

export { IState as State };
