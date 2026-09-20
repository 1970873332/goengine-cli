import Vector3 from "@goengine/core/src/object/math/vector/Vector3";
import BaseNode, {
    BaseNodeConfig,
    BaseNodeEvent,
} from "@goengine/core/src/object/Node";

/**
 * gl基础节点
 */
export default abstract class BaseGLNode<
    C extends IConfig,
    E extends IEvent,
> extends BaseNode<C, E, IAny> {
    /**
     * 向上的向量
     */
    public readonly up = new Vector3(0, 1, 0);
    /**
     * 渲染顺序（越小越先绘制，优先于材质分组）
     */
    public renderOrder: number = 0;
    /**
     * 图层位掩码（与相机图层按位与，非零才渲染，对应 three.js Layers）
     */
    public layers: number = 1;

    public setConfig(config: C): void {
        super.setConfig(config);

        const {
            up,
            renderOrder = this.renderOrder,
            layers = this.layers,
        } = config;

        up && this.up.set(up.x, up.y, up.z, true);
        Object.assign(this, { renderOrder, layers });
    }

    public copy(target: this, silence?: boolean): this {
        const { up, renderOrder, layers } = target;

        this.up.copy(up, true);
        Object.assign(this, { renderOrder, layers });

        return super.copy(target, silence);
    }
}

interface IConfig extends BaseNodeConfig {
    /**
     * 朝上的向量
     */
    up?: VectorObject.Vector3;
    /**
     * 渲染顺序
     */
    renderOrder?: number;
    /**
     * 图层位掩码
     */
    layers?: number;
}

interface IEvent extends BaseNodeEvent {}

type IAny = BaseGLNode<any, any>;

export {
    IAny as BaseGLNodeAny,
    IConfig as BaseGLNodeConfig,
    IEvent as BaseGLNodeEvent,
};
