import { TextureAny } from "../../state/Texture";
import BaseMaterial, {
    BaseMaterialEvent,
    MaterialConfig,
} from "../Base";
import Texture from "../../state/Texture";

/**
 * 基础网格材质（对应 three.js 的 MeshBasicMaterial）
 *
 * 使用默认着色器：颜色 × 透明度 × 贴图（无贴图时采样默认 1x1 白色纹理）。
 */
export default class MeshBasicMaterial extends BaseMaterial<IConfig, IEvent> {
    /**
     * 基础网格材质
     * @param config 配置
     */
    constructor(config?: IConfig) {
        super();

        config && this.setConfig(config);
    }

    /**
     * 贴图（默认 1x1 白色纹理，采样结果为纯色）
     */
    public map: TextureAny = new Texture();

    public setConfig(config: IConfig): void {
        super.setConfig(config);

        const { map = this.map } = config;

        this.map = map;
    }

    public copy(target: this, silence?: boolean): this {
        const { map } = target;

        this.map = map;

        return super.copy(target, silence);
    }
}

interface IEvent extends BaseMaterialEvent {}

interface IConfig extends MaterialConfig {
    /**
     * 贴图
     */
    map?: TextureAny;
}

export { IConfig as MeshBasicMaterialConfig };
