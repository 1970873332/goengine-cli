import { BaseMaterialAny } from "../material/Base";
import { BASE_FRAG } from "../glsl/fragment/Index";
import { DEFAULT_FRAG } from "../glsl/fragment/Index";
import { BASE_VERT } from "../glsl/vertex/Index";
import { DEFAULT_VERT } from "../glsl/vertex/Index";
import ShaderMaterial from "../material/node/Shader";
import ShaderState, { ShaderStateAny } from "../state/Shader";
import MapCache from "./base/Map";

/**
 * 着色器缓存
 */
export default class CacheShader extends MapCache<ShaderStateAny> {
    /**
     * 顶点着色器ID
     * @param name
     * @returns
     */
    protected vertexID(name: string): string {
        return `${name}_vertex`;
    }
    /**
     * 片段着色器ID
     * @param name
     * @returns
     */
    protected fragmentID(name: string): string {
        return `${name}_fragment`;
    }
    /**
     * 存储
     * @param type
     * @param id
     * @param char
     */
    protected storage(type: GLenum, id: string, char: string): ShaderStateAny {
        if (this.has(id)) return this.get(id)!;
        const base: string = (() => {
                switch (type) {
                    case this.gl.VERTEX_SHADER:
                        return BASE_VERT;
                    case this.gl.FRAGMENT_SHADER:
                        return BASE_FRAG;
                    default:
                        throw new Error(`未知的着色器类型: ${type}`);
                }
            })(),
            // 完整着色器（以 #version 开头）直接使用；
            // 片段源码（仅 main 函数体）由 BASE_* 前缀提供公共声明，
            // 避免用户重复编写 #version / in / out / uniform 声明。
            trimmed: string = char.trim(),
            source: string = trimmed.startsWith("#version")
                ? trimmed
                : `${base}\n${trimmed}`,
            shader = new ShaderState(type, source, id)
                .trust()
                .compiled(this.gl);
        shader.complete && this.set(id, shader);
        return shader;
    }
    /**
     * 分配
     * @param material
     */
    public allocate(material: BaseMaterialAny): WebGL.Shader<ShaderStateAny> {
        if (material instanceof ShaderMaterial) {
            const {
                vertex: { id: vertexID, char: vertexChar },
                fragment: { id: fragmentID, char: fragmentChar },
            } = material;
            return {
                id: `${vertexID}|${fragmentID}`,
                vertex: this.storage(
                    this.gl.VERTEX_SHADER,
                    vertexID,
                    vertexChar,
                ),
                fragment: this.storage(
                    this.gl.FRAGMENT_SHADER,
                    fragmentID,
                    fragmentChar,
                ),
            };
        } else {
            const name: string = material.constructor.name,
                vertexID: string = this.vertexID(name),
                fragmentID: string = this.fragmentID(name),
                // 内置材质使用默认完整着色器
                vertexChar: string = DEFAULT_VERT,
                fragmentChar: string = DEFAULT_FRAG;
            return {
                id: `${vertexID}|${fragmentID}`,
                vertex: this.storage(
                    this.gl.VERTEX_SHADER,
                    vertexID,
                    vertexChar,
                ),
                fragment: this.storage(
                    this.gl.FRAGMENT_SHADER,
                    fragmentID,
                    fragmentChar,
                ),
            };
        }
    }

    /**
     * 释放所有着色器
     */
    public dispose(): void {
        this.forEach((shader) => {
            shader.webglShader && this.gl.deleteShader(shader.webglShader);
        });
        this.clear();
    }
}
