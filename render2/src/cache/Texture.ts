import { TextureAny } from "../state/Texture";
import MapCache from "./base/Map";

/**
 * 纹理缓存
 */
export default class TextureCache extends MapCache<WebGLTexture> {
    /**
     * 默认纹理
     */
    declare protected texture: WebGLTexture;

    constructor(gl: Canvas.WebGLContext) {
        super(gl);
        // 1x1 白色纹理：图片未加载完成时兜底，避免绑定 undefined
        this.texture = this.createDefault();
    }

    /**
     * 创建默认 1x1 白色纹理
     */
    protected createDefault(): WebGLTexture {
        const texture: WebGLTexture = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            1,
            1,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255]),
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR,
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR,
        );
        return texture;
    }

    /**
     * 分配
     * @param target
     * @returns
     */
    public allocate(texture: TextureAny): WebGLTexture {
        const { uuid, source } = texture;
        if (this.has(uuid)) return this.get(uuid)!;
        if (!(source instanceof HTMLImageElement) || !source.complete)
            return this.texture;

        const webgltexture: WebGLTexture = this.gl.createTexture();

        // 绑定纹理
        this.gl.bindTexture(this.gl.TEXTURE_2D, webgltexture);
        // Y轴翻转纹理
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        // 加载纹理
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            source,
        );
        // 恢复像素存储状态
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        // 生成mipmap
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        // 设置纹理参数
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE,
        );
        // 设置纹理过滤
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR_MIPMAP_LINEAR,
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR,
        );
        // 应用各向异性过滤
        const extension: EXT_texture_filter_anisotropic | null =
            this.gl.getExtension("EXT_texture_filter_anisotropic") ||
            this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
            this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
        extension &&
            this.gl.texParameterf(
                this.gl.TEXTURE_2D,
                extension.TEXTURE_MAX_ANISOTROPY_EXT,
                Math.min(
                    4.0,
                    this.gl.getParameter(
                        extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT,
                    ),
                ), // 4x各向异性过滤
            );
        this.set(uuid, webgltexture);
        return webgltexture;
    }

    /**
     * 释放所有纹理（含默认纹理）
     */
    public dispose(): void {
        this.forEach((texture) => this.gl.deleteTexture(texture));
        this.clear();
        this.texture && this.gl.deleteTexture(this.texture);
    }
}
