import Matrix4 from "@goengine/core/src/object/math/matrix/Matrix4";
import Vector3 from "@goengine/core/src/object/math/vector/Vector3";
import { ColorUtils } from "@goengine/core/src/util/Color";
import {
    CullFace,
    UniformKey,
    UniformType,
} from "../GLSL";
import { BaseGLNodeAny } from "../node/Base";
import Mesh, { MeshAny } from "../node/common/Mesh";
import Scene from "../node/common/Scene";
import Texture, { TextureAny } from "../state/Texture";
import BufferCache from "../cache/Buffer";
import ProgramCache from "../cache/Program";
import ShaderCache from "../cache/Shader";
import StateCache, { State } from "../cache/State";
import TextureCache from "../cache/Texture";
import { CameraAny } from "../camera/Camera";
import Frustum from "../camera/Frustum";
import { BaseGeometryAny } from "../geometry/Base";
import { BaseMaterialAny } from "../material/Base";
import MeshBasicMaterial from "../material/node/MeshBasic";
import ShaderMaterial, { ShaderMaterialUniform } from "../material/node/Shader";
import GLState from "../state/GLState";
import RenderList from "./RenderList";

/**
 * Webgl渲染器
 */
export default class WebglRenderer {
    constructor(config: IConfig) {
        const { gl = this.gl } = config;

        Object.assign(this, {
            gl,
            stateCache: new StateCache(gl),
            shaderCache: new ShaderCache(gl),
            bufferCache: new BufferCache(gl),
            textureCache: new TextureCache(gl),
            programCache: new ProgramCache(gl),
            glState: new GLState(gl),
        });
    }

    /**
     * 当前使用的程序
     */
    declare protected currentProgram: WebGLProgram;
    /**
     * webgl上下文
     */
    declare protected gl: Canvas.WebGLContext;
    /**
     * 缓冲缓存
     */
    declare protected bufferCache: BufferCache;
    /**
     * 着色器缓存
     */
    declare protected shaderCache: ShaderCache;
    /**
     * 纹理缓存
     */
    declare protected textureCache: TextureCache;
    /**
     * 程序缓存
     */
    declare protected programCache: ProgramCache;
    /**
     * 状态缓存
     */
    declare protected stateCache: StateCache;
    /**
     * GL 渲染状态机（对应 three.js WebGLState）
     */
    declare protected glState: GLState;
    /**
     * 临时float32数组
     */
    protected readonly interimFloat32Array = new Float32Array(
        Matrix4.identity.length,
    );
    /**
     * 帧计数：用于按程序每帧只上传一次视图/投影矩阵
     */
    protected frame: number = 0;
    /**
     * 渲染列表（对应 three.js WebGLRenderList）
     */
    protected readonly renderList = new RenderList();
    /**
     * 渲染统计（对应 three.js WebGLInfo）
     */
    public readonly info: IInfo = {
        render: {
            calls: 0,
            triangles: 0,
            frame: 0,
        },
    };
    /**
     * 临时向量：计算节点深度
     */
    protected readonly view = new Vector3();
    /**
     * 视锥体（每帧由视图投影矩阵更新，用于剔除）
     */
    protected readonly frustum = new Frustum();
    /**
     * 视图投影矩阵（复用，避免每帧分配）
     */
    protected readonly viewProjection = new Matrix4();
    /**
     * 临时向量：包围球世界中心
     */
    protected readonly sphereCenter = new Vector3();
    /**
     * 几何体包围球缓存（position 数据源变化时重算）
     */
    protected readonly boundingSpheres = new WeakMap<
        BaseGeometryAny,
        ISphere
    >();
    /**
     * 材质排序序号（稳定分组，减少程序切换）
     */
    protected readonly materialOrder = new WeakMap<BaseMaterialAny, number>();
    /**
     * 材质序号计数
     */
    protected materialOrderCounter: number = 0;
    /**
     * uniform 条目缓存（按 uniforms 对象复用 Object.entries 结果）
     */
    protected readonly uniformEntries = new WeakMap<
        object,
        Array<[string, { type: UniformType; value: unknown }]>
    >();

    /**
     * 应用MVP矩阵
     * @param key
     * @param matrix
     * @param program
     * @param state
     */
    protected applyMVPMatrix(
        key: string,
        matrix: Matrix4,
        program: WebGLProgram,
        state: State,
    ): void {
        const {
            uniform: {
                location,
                missing,
            }
        } = state;

        // 程序不存在的 uniform：首次记录后静默跳过，避免每帧刷警告
        if (missing.has(key)) return;

        let u_matrix: WebGLUniformLocation | undefined = location[key];

        if (!u_matrix) {
            u_matrix = this.gl.getUniformLocation(program, key) ?? void 0;

            if (!u_matrix) {
                missing.add(key);
                console.warn(`uniform变量${key}未找到`);
                return;
            }

            location[key] = u_matrix;
        }

        // 4. 更新矩阵数据
        this.interimFloat32Array.set(matrix.m);
        this.gl.uniformMatrix4fv(u_matrix, false, this.interimFloat32Array);
    }
    /**
     * 应用材质内置 uniform（颜色与透明度）
     * @param material
     * @param program
     * @param state
     */
    protected applyMaterialUniform(
        material: BaseMaterialAny,
        program: WebGLProgram,
        state: State,
    ): void {
        const [red, green, blue] = ColorUtils.hexToRGBA(material.color);

        this.applySilentUniform(
            "u_color",
            program,
            state,
            (location) =>
                this.gl.uniform3f(
                    location,
                    red / 255,
                    green / 255,
                    blue / 255,
                ),
        );
        this.applySilentUniform(
            "u_opacity",
            program,
            state,
            (location) => this.gl.uniform1f(location, material.alpha),
        );
        // MeshBasicMaterial 贴图（无贴图时采样默认 1x1 白色纹理）
        if (material instanceof MeshBasicMaterial) {
            this.applySilentUniform(
                "u_map",
                program,
                state,
                (location) =>
                    this.bindTextureUniform(
                        "u_map",
                        material.map,
                        location,
                        state,
                    ),
            );
        }
    }
    /**
     * 静默设置 uniform：着色器未声明该变量时只记录一次，不刷警告
     * @param name
     * @param program
     * @param state
     * @param apply
     */
    protected applySilentUniform(
        name: string,
        program: WebGLProgram,
        state: State,
        apply: (location: WebGLUniformLocation) => void,
    ): void {
        const {
            uniform: { location, missing },
        } = state;

        if (missing.has(name)) return;

        let uniform_location: WebGLUniformLocation | undefined =
            location[name];

        if (!uniform_location) {
            uniform_location =
                this.gl.getUniformLocation(program, name) ?? void 0;

            if (!uniform_location) {
                missing.add(name);
                return;
            }

            location[name] = uniform_location;
        }

        apply(uniform_location);
    }
    /**
     * 解析 uniform 值：数字 / 数组 / 类型化数组 / 矩阵 / 向量对象
     * @param value
     * @returns
     */
    protected resolveUniformValue(
        value: unknown,
    ): number | number[] | Float32Array {
        if (typeof value === "number") return value;
        if (Array.isArray(value) || ArrayBuffer.isView(value))
            return value as number[] | Float32Array;

        const object = value as {
            m?: number[];
            x?: number;
            y?: number;
            z?: number;
            w?: number;
            toArray?: () => number[];
        };
        // 矩阵对象
        if (object?.m) return object.m;
        // 向量对象
        if (typeof object?.x === "number")
            return [
                object.x,
                object.y ?? 0,
                object.z ?? 0,
                object.w ?? 0,
            ];
        if (typeof object?.toArray === "function") return object.toArray();
        return 0;
    }
    /**
     * 应用渲染模式
     * @param material
     */
    protected applyRenderMode(material: BaseMaterialAny): void {
        const {
            transparent,
            depthTest,
            depthWrite,
            cull,
            blending,
            depthFunc,
            colorWrite,
        } = material;
        const { glState } = this;

        // 混合：透明材质启用混合，不透明禁用
        glState.setBlend(transparent);
        // 混合函数：仅在透明且模式变化时更新
        transparent && glState.setBlending(blending);
        // 深度测试
        glState.setDepthTest(depthTest);
        // 深度写入：透明物体不写入深度（深度测试仍生效，不透明物体正常遮挡）。
        // 否则双面渲染时远面先绘制会与后绘制的近面在同一像素上重复混合，
        // 产生随视角变化的明暗斑块（看起来像部分面有阴影）
        glState.setDepthMask(depthWrite && !transparent);
        // 深度比较函数（three.js Material.depthFunc）
        glState.setDepthFunc(depthFunc);
        // 剔除：None 关闭剔除，Front / Back 分别剔除对应面
        const culling: boolean = cull !== CullFace.None;
        glState.setCull(culling);
        culling && glState.setCullFace(cull);
        // 颜色通道写入（three.js Material.colorWrite）
        glState.setColorMask(colorWrite, colorWrite, colorWrite, colorWrite);
    }

    /**
     * 设置uniform变量值
     * @param uniforms
     * @param program
     * @param state
     */
    protected setupUniform(
        uniforms: ShaderMaterialUniform,
        program: WebGLProgram,
        state: State,
    ): void {
        const {
            uniform: { location, missing },
        } = state;
        let entries = this.uniformEntries.get(uniforms);
        if (!entries) {
            entries = Object.entries(uniforms) as Array<
                [string, { type: UniformType; value: unknown }]
            >;
            this.uniformEntries.set(uniforms, entries);
        }

        entries.forEach(([name, attribute]) => {
            // 程序不存在的 uniform：首次记录后静默跳过，避免每帧刷警告
            if (missing.has(name)) return;

            let uniform_location: WebGLUniformLocation | undefined =
                location[name];

            if (!uniform_location) {
                uniform_location =
                    this.gl.getUniformLocation(program, name) ?? void 0;

                if (!uniform_location) {
                    missing.add(name);
                    return console.warn(`uniform变量${name}未找到`);
                }

                location[name] = uniform_location;
            }

            // 设置uniform变量值
            switch (attribute.type) {
                case UniformType.Texture:
                case UniformType.Sampler2D:
                    if (attribute.value instanceof Texture) {
                        this.bindTextureUniform(
                            name,
                            attribute.value,
                            uniform_location,
                            state,
                        );
                    }
                    break;
                case UniformType.Float:
                    this.gl.uniform1f(
                        uniform_location,
                        attribute.value as number,
                    );
                    break;
                case UniformType.Int:
                    this.gl.uniform1i(
                        uniform_location,
                        attribute.value as number,
                    );
                    break;
                case UniformType.Vec2:
                    this.gl.uniform2fv(
                        uniform_location,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Vec3:
                    this.gl.uniform3fv(
                        uniform_location,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Vec4:
                    this.gl.uniform4fv(
                        uniform_location,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Mat2:
                    this.gl.uniformMatrix2fv(
                        uniform_location,
                        false,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Mat3:
                    this.gl.uniformMatrix3fv(
                        uniform_location,
                        false,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Mat4:
                    this.gl.uniformMatrix4fv(
                        uniform_location,
                        false,
                        this.resolveUniformValue(attribute.value) as
                            | number[]
                            | Float32Array,
                    );
                    break;
                case UniformType.Sampler3D:
                case UniformType.SamplerCube:
                    if (!missing.has(`${name}:type`)) {
                        missing.add(`${name}:type`);
                        console.warn(
                            `uniform变量${name}的类型${attribute.type}暂不支持`,
                        );
                    }
                    break;
            }
        });
    }
    /**
     * 分配纹理单元（优先空闲单元，按程序记录占用）
     * @param state
     * @returns
     */
    protected allocateTextureUnit(state: State): number {
        const { units } = state.texture;
        const max: number =
            this.stateCache.maxUnit ??
            (this.stateCache.maxUnit = this.gl.getParameter(
                this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
            ));
        let unit: number = 0;
        while (units.has(unit) && unit < max - 1) unit++;
        return unit;
    }
    /**
     * 绑定纹理到指定单元（带全局缓存，避免重复 GL 调用）
     * @param unit
     * @param texture
     */
    protected bindTextureUnit(unit: number, texture: WebGLTexture): void {
        const { gl } = this,
            { stateCache } = this;
        if (stateCache.unit !== unit) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            stateCache.unit = unit;
        }
        if (stateCache.textures.get(unit) !== texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            stateCache.textures.set(unit, texture);
        }
    }
    /**
     * 绑定纹理采样 uniform（按程序缓存 uniform -> unit，全局缓存单元当前纹理）
     * @param name
     * @param texture
     * @param uniform_location
     * @param state
     */
    protected bindTextureUniform(
        name: string,
        texture: TextureAny,
        uniform_location: WebGLUniformLocation,
        state: State,
    ): void {
        const webglTexture: WebGLTexture =
            this.textureCache.allocate(texture);
        const binding = state.texture.bindings.get(name);
        if (binding && binding.texture === webglTexture) {
            // 绑定未变：若该单元被其它程序覆盖则补绑
            if (this.stateCache.textures.get(binding.unit) !== webglTexture) {
                this.bindTextureUnit(binding.unit, webglTexture);
            }
            return;
        }
        let unit: number;
        if (binding) {
            // 纹理变化，复用该 uniform 的单元
            unit = binding.unit;
        } else {
            unit = this.allocateTextureUnit(state);
            state.texture.units.add(unit);
        }
        this.bindTextureUnit(unit, webglTexture);
        if (!binding || binding.unit !== unit) {
            this.gl.uniform1i(uniform_location, unit);
        }
        state.texture.bindings.set(name, {
            texture: webglTexture,
            unit,
        });
    }

    /**
     * 渲染节点
     * @param node
     * @param camera
     * @returns
     */
    public renderNode(node: MeshAny, camera: CameraAny): void {
        const { material, geometry } = node;
        if (!material || !geometry) return;
        const // 分配着色器
            shader = this.shaderCache.allocate(material),
            // 分配程序
            program = this.programCache.allocate(shader);
        if (!program) return console.warn("程序未准备就绪", node);
        // 分配状态
        const state = this.stateCache.allocate(program);

        if (program !== this.currentProgram) {
            this.currentProgram = program;

            this.gl.useProgram(program);
        }
        // 应用渲染模式（每个节点都应用，材质不同的网格共享同一 program 时也正确切换）
        this.applyRenderMode(material);

        // 视图/投影矩阵整帧不变：每个程序每帧（或换相机时）只上传一次，
        // 模型矩阵仍需每节点上传
        const { viewFrame, viewCamera } = state.uniform;
        if (viewFrame !== this.frame || viewCamera !== camera) {
            state.uniform.viewFrame = this.frame;
            state.uniform.viewCamera = camera;
            this.applyMVPMatrix(
                UniformKey.viewMatrix,
                // 本库约定：相机节点的 worldMatrix 即为视图矩阵（由 Matrix4.lookAt 写入）
                camera.worldMatrix,
                program,
                state,
            );
            this.applyMVPMatrix(
                UniformKey.projectionMatrix,
                camera.projectionMatrix,
                program,
                state,
            );
        }
        this.applyMVPMatrix(
            UniformKey.modelMatrix,
            node.worldMatrix,
            program,
            state,
        );

        // 绑定缓冲
        this.bufferCache.bind(geometry, program, state);

        // 应用材质内置 uniform（颜色 / 透明度）
        this.applyMaterialUniform(material, program, state);

        // 更新uniform变量
        if (material instanceof ShaderMaterial) {
            this.setupUniform(material.uniforms, program, state);
        }

        // 绘制
        if (geometry.index) {
            this.gl.drawElements(
                this.gl.TRIANGLES,
                geometry.index.length,
                geometry.index.array.BYTES_PER_ELEMENT === 4
                    ? this.gl.UNSIGNED_INT
                    : this.gl.UNSIGNED_SHORT,
                0,
            );
            this.info.render.calls++;
            this.info.render.triangles += geometry.index.length / 3;
        } else {
            const {
                attribute: { position },
            } = geometry,
                { size, length } = position ?? { size: 0, length: 0 };
            const count: number = length / size;
            this.gl.drawArrays(this.gl.TRIANGLES, 0, count);
            this.info.render.calls++;
            this.info.render.triangles += count / 3;
        }
    }
    /**
     * 渲染场景
     * @param scene
     * @param camera
     */
    public render(scene: Scene, camera: CameraAny): void {
        this.frame++;
        const { renderList, info } = this;

        // 每帧重建视锥：视图投影 = 投影 × 视图（与着色器 u_projectionMatrix * u_viewMatrix 顺序一致）
        this.viewProjection
            .copy(camera.projectionMatrix)
            .multiply(camera.worldMatrix);
        this.frustum.fromMatrix(this.viewProjection);

        // 统计清零
        info.render.calls = 0;
        info.render.triangles = 0;
        info.render.frame = this.frame;

        // 投影收集（可见性 + 图层 + 视锥剔除 + 深度）
        renderList.clear();
        scene.children.forEach((child) => this.projectNode(child, camera));

        // 排序（opaque 近到远 / transparent 远到近）
        renderList.sort();

        renderList.opaque.forEach(({ node }) => this.renderNode(node, camera));
        renderList.transparent.forEach(({ node }) =>
            this.renderNode(node, camera),
        );
    }
    /**
     * 渲染场景（render 的兼容别名）
     * @param scene
     * @param camera
     */
    public renderScene(scene: Scene, camera: CameraAny): void {
        this.render(scene, camera);
    }
    /**
     * 投影收集渲染条目（对应 three.js WebGLRenderer.projectObject：
     * 可见性 / 图层 / 视锥剔除 / 深度计算，递归遍历场景树）
     * @param node
     * @param camera
     */
    protected projectNode(node: BaseGLNodeAny, camera: CameraAny): void {
        if (!node.visible) return;
        // 图层：节点与相机图层无交集则跳过（three.js Layers）
        if ((camera.layers & node.layers) === 0) return;

        if (node instanceof Mesh) {
            const { material, geometry } = node;
            if (material && geometry) {
                // 视锥剔除（mesh.frustumCulled = false 时始终渲染）
                if (
                    !node.frustumCulled ||
                    this.frustumContains(node, geometry)
                ) {
                    // 深度：世界坐标经视图投影矩阵变换后的 clip z（近处更负，与 three.js 同口径）
                    const z = this.view
                        .copy(node.worldPosition)
                        .applyMatrix4(this.viewProjection).z;
                    let order = this.materialOrder.get(material);
                    if (order === undefined) {
                        order = this.materialOrderCounter++;
                        this.materialOrder.set(material, order);
                    }
                    this.renderList.push(
                        node,
                        geometry,
                        material,
                        0, // groupOrder（多材质 group 预留）
                        node.renderOrder,
                        z,
                        0, // group（多材质 group 预留）
                        order,
                    );
                }
            }
        }
        node.children.forEach((child) => this.projectNode(child, camera));
    }
    /**
     * 视锥剔除测试：几何体包围球经世界矩阵变换后与视锥求交
     * @param node
     * @param geometry
     * @returns
     */
    protected frustumContains(
        node: MeshAny,
        geometry: BaseGeometryAny,
    ): boolean {
        const sphere = this.boundingSphere(geometry);
        if (!sphere) return true;
        const center = this.sphereCenter
            .copy(sphere.center)
            .applyMatrix4(node.worldMatrix);
        const { worldScale } = node;
        const maxScale: number = Math.max(
            Math.abs(worldScale.x),
            Math.abs(worldScale.y),
            Math.abs(worldScale.z),
        );
        return this.frustum.intersectsSphere(center, sphere.radius * maxScale);
    }
    /**
     * 计算 / 获取几何体包围球（position 数据源变化时重算）
     * @param geometry
     * @returns
     */
    protected boundingSphere(geometry: BaseGeometryAny): ISphere | undefined {
        const position = geometry.attribute.position;
        if (!position) return undefined;
        const cached = this.boundingSpheres.get(geometry);
        if (cached && cached.source === position.array.buffer) return cached;

        const { array, size } = position;
        let minX = Infinity,
            minY = Infinity,
            minZ = Infinity,
            maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;
        for (let i = 0; i < array.length; i += size) {
            const x = array[i],
                y = array[i + 1],
                z = array[i + 2];
            x < minX && (minX = x);
            x > maxX && (maxX = x);
            y < minY && (minY = y);
            y > maxY && (maxY = y);
            z < minZ && (minZ = z);
            z > maxZ && (maxZ = z);
        }
        if (!isFinite(minX)) return undefined;
        const cx = (minX + maxX) / 2,
            cy = (minY + maxY) / 2,
            cz = (minZ + maxZ) / 2;
        let radiusSq = 0;
        for (let i = 0; i < array.length; i += size) {
            const dx = array[i] - cx,
                dy = array[i + 1] - cy,
                dz = array[i + 2] - cz,
                d = dx * dx + dy * dy + dz * dz;
            d > radiusSq && (radiusSq = d);
        }
        const sphere: ISphere = {
            center: new Vector3().set(cx, cy, cz),
            radius: Math.sqrt(radiusSq),
            source: position.array.buffer,
        };
        this.boundingSpheres.set(geometry, sphere);
        return sphere;
    }
    /**
     * 设置绘制尺寸（同步 viewport，画布尺寸变化后必须调用）
     * @param width
     * @param height
     */
    public setSize(width: number, height: number): void {
        this.glState.setViewport(0, 0, width, height);
    }
    /**
     * 销毁
     */
    public destroy(): void {
        this.bufferCache.dispose();
        this.textureCache.dispose();
        this.programCache.dispose();
        this.shaderCache.dispose();
    }
}

/**
 * 渲染统计（对应 three.js WebGLInfo）
 */
interface IInfo {
    /**
     * 渲染统计
     */
    render: {
        /**
         * 绘制调用次数
         */
        calls: number;
        /**
         * 三角形数量
         */
        triangles: number;
        /**
         * 帧号
         */
        frame: number;
    };
}

/**
 * 包围球
 */
interface ISphere {
    /**
     * 球心（几何体局部坐标）
     */
    center: Vector3;
    /**
     * 半径
     */
    radius: number;
    /**
     * 计算时的 position 数据源（变化时重算）
     */
    source: ArrayBuffer;
}

interface IConfig {
    /**
     * webgl上下文
     */
    gl: Canvas.WebGLContext;
}
