import { Blend, CullFace, DepthFunc } from "../GLSL";

/**
 * GL 渲染状态缓存（对应 three.js 的 WebGLState）：
 * 记录已应用到上下文的状态，只有变化时才调用 GL，避免重复设置。
 */
export default class GLState {
    /**
     * 是否启用混合
     */
    protected blend: boolean = false;
    /**
     * 当前混合模式
     */
    protected blending: Blend = Blend.None;
    /**
     * 是否启用深度测试
     */
    protected depthTest: boolean = false;
    /**
     * 是否写入深度
     */
    protected depthMask: boolean = true;
    /**
     * 深度比较函数
     */
    protected depthFunc: DepthFunc = DepthFunc.Less;
    /**
     * 颜色通道写入
     */
    protected colorMask: [boolean, boolean, boolean, boolean] = [
        true,
        true,
        true,
        true,
    ];
    /**
     * 是否启用面剔除
     */
    protected cull: boolean = false;
    /**
     * 当前剔除面
     */
    protected cullFace: CullFace = CullFace.None;
    /**
     * 正面绕序
     */
    protected frontFace: GLenum;
    /**
     * 视口
     */
    protected viewport: [number, number, number, number] = [0, 0, 0, 0];

    constructor(protected gl: Canvas.WebGLContext) {
        this.frontFace = gl.CCW;
    }

    /**
     * 混合开关
     */
    public setBlend(enabled: boolean): void {
        if (this.blend !== enabled) {
            this.blend = enabled;
            enabled ? this.gl.enable(this.gl.BLEND) : this.gl.disable(this.gl.BLEND);
        }
    }

    /**
     * 混合模式
     */
    public setBlending(blending: Blend): void {
        if (this.blending !== blending) {
            this.blending = blending;
            switch (blending) {
                case Blend.None:
                    this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);
                    break;
                case Blend.Normal:
                default:
                    this.gl.blendFunc(
                        this.gl.SRC_ALPHA,
                        this.gl.ONE_MINUS_SRC_ALPHA,
                    );
                    break;
            }
            this.gl.blendEquation(this.gl.FUNC_ADD);
        }
    }

    /**
     * 深度测试开关
     */
    public setDepthTest(enabled: boolean): void {
        if (this.depthTest !== enabled) {
            this.depthTest = enabled;
            enabled
                ? this.gl.enable(this.gl.DEPTH_TEST)
                : this.gl.disable(this.gl.DEPTH_TEST);
        }
    }

    /**
     * 深度写入
     */
    public setDepthMask(mask: boolean): void {
        if (this.depthMask !== mask) {
            this.depthMask = mask;
            this.gl.depthMask(mask);
        }
    }

    /**
     * 深度比较函数
     */
    public setDepthFunc(func: DepthFunc): void {
        if (this.depthFunc !== func) {
            this.depthFunc = func;
            this.gl.depthFunc(func);
        }
    }

    /**
     * 颜色通道写入
     */
    public setColorMask(
        r: boolean,
        g: boolean,
        b: boolean,
        a: boolean,
    ): void {
        const { colorMask } = this;
        if (
            colorMask[0] !== r ||
            colorMask[1] !== g ||
            colorMask[2] !== b ||
            colorMask[3] !== a
        ) {
            this.colorMask = [r, g, b, a];
            this.gl.colorMask(r, g, b, a);
        }
    }

    /**
     * 面剔除开关
     */
    public setCull(enabled: boolean): void {
        if (this.cull !== enabled) {
            this.cull = enabled;
            enabled
                ? this.gl.enable(this.gl.CULL_FACE)
                : this.gl.disable(this.gl.CULL_FACE);
        }
    }

    /**
     * 剔除面
     */
    public setCullFace(face: CullFace): void {
        if (this.cullFace !== face) {
            this.cullFace = face;
            this.gl.cullFace(face === CullFace.Front ? this.gl.FRONT : this.gl.BACK);
        }
    }

    /**
     * 正面绕序
     */
    public setFrontFace(face: GLenum): void {
        if (this.frontFace !== face) {
            this.frontFace = face;
            this.gl.frontFace(face);
        }
    }

    /**
     * 视口
     */
    public setViewport(
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        const { viewport } = this;
        if (
            viewport[0] !== x ||
            viewport[1] !== y ||
            viewport[2] !== width ||
            viewport[3] !== height
        ) {
            this.viewport = [x, y, width, height];
            this.gl.viewport(x, y, width, height);
        }
    }
}
