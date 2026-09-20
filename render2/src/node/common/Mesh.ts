import { BaseGeometryAny } from "../../geometry/Base";
import { BaseMaterialAny } from "../../material/Base";
import BaseGLNode, { BaseGLNodeConfig } from "../Base";

/**
 * 网格
 */
export default class Mesh<
    G extends BaseGeometryAny,
    M extends BaseMaterialAny,
    C extends IConfig,
    E extends {},
> extends BaseGLNode<C, E> {
    constructor(
        public geometry?: G,
        public material?: M,
        config?: C,
    ) {
        super();

        config && this.setConfig(config);
    }

    public copy(target: this, silence?: boolean): this {
        const { geometry, material, frustumCulled } = target;

        Object.assign(this, { geometry, material, frustumCulled });

        return super.copy(target, silence);
    }

    /**
     * 是否参与视锥剔除（false 时始终渲染）
     */
    public frustumCulled: boolean = true;
}

interface IConfig extends BaseGLNodeConfig {}

type IAny = Mesh<BaseGeometryAny, BaseMaterialAny, any, any>;

export { IAny as MeshAny, IConfig as MeshConfig };
