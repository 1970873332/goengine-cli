import { BaseGeometryAny } from "../geometry/Base";
import { BaseMaterialAny } from "../material/Base";
import { MeshAny } from "../node/common/Mesh";

/**
 * 渲染条目（对应 three.js 的 WebGLRenderItem）
 */
export interface IRenderItem {
    /**
     * 网格节点
     */
    node: MeshAny;
    /**
     * 几何体
     */
    geometry: BaseGeometryAny;
    /**
     * 材质
     */
    material: BaseMaterialAny;
    /**
     * 几何体分组顺序（多材质 group 预留）
     */
    groupOrder: number;
    /**
     * 渲染顺序（用户控制，优先于材质分组与深度）
     */
    renderOrder: number;
    /**
     * 视图投影后的 clip z（近处更负，与 three.js 排序口径一致）
     */
    z: number;
    /**
     * 几何体分组（多材质 group 预留）
     */
    group: number;
    /**
     * 材质排序序号（稳定分组，减少程序切换）
     */
    materialOrder: number;
}

/**
 * 渲染列表（对应 three.js 的 WebGLRenderList）
 *
 * 不透明：groupOrder → renderOrder → 材质分组 → z 升序（近到远，利于 early-z）
 * 透明：groupOrder → renderOrder → z 降序（远到近，画家排序）
 */
export default class RenderList {
    /**
     * 不透明条目
     */
    public readonly opaque: IRenderItem[] = [];
    /**
     * 透明条目
     */
    public readonly transparent: IRenderItem[] = [];

    /**
     * 清空列表（复用数组，避免每帧分配）
     */
    public clear(): void {
        this.opaque.length = 0;
        this.transparent.length = 0;
    }

    /**
     * 推入渲染条目
     * @param node
     * @param geometry
     * @param material
     * @param groupOrder
     * @param renderOrder
     * @param z
     * @param group
     * @param materialOrder
     */
    public push(
        node: MeshAny,
        geometry: BaseGeometryAny,
        material: BaseMaterialAny,
        groupOrder: number,
        renderOrder: number,
        z: number,
        group: number,
        materialOrder: number,
    ): void {
        const item: IRenderItem = {
            node,
            geometry,
            material,
            groupOrder,
            renderOrder,
            z,
            group,
            materialOrder,
        };
        if (material.transparent) this.transparent.push(item);
        else this.opaque.push(item);
    }

    /**
     * 排序（与 three.js WebGLRenderList 同口径）
     */
    public sort(): void {
        this.opaque.sort(opaqueSort);
        this.transparent.sort(transparentSort);
    }
}

/**
 * 不透明排序：近到远（front-to-back，利于 early-z）
 */
function opaqueSort(a: IRenderItem, b: IRenderItem): number {
    return (
        a.groupOrder - b.groupOrder ||
        a.renderOrder - b.renderOrder ||
        a.materialOrder - b.materialOrder ||
        a.z - b.z ||
        a.group - b.group
    );
}

/**
 * 透明排序：远到近（back-to-front，画家算法）
 */
function transparentSort(a: IRenderItem, b: IRenderItem): number {
    return (
        a.groupOrder - b.groupOrder ||
        a.renderOrder - b.renderOrder ||
        b.z - a.z ||
        a.group - b.group
    );
}
