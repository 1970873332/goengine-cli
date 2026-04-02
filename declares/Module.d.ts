declare module "*.js";
declare module "*.jsx";
declare module "*.scss";
declare module "*.css";
declare module "*.ico";

declare module "*.glsl" {
    const value: string;
    export default value;
}

declare module "*.wgsl" {
    const value: string;
    export default value;
}

declare module "*.frag" {
    const value: string;
    export default value;
}

declare module "*.vert" {
    const value: string;
    export default value;
}

declare module "*.wk" {
    class WebWorker<T extends Record<any, unknown> = {}> extends Worker {
        constructor();

        postMessage(message: T, transfer: Transferable[]): void;

        postMessage(message: T, options?: StructuredSerializeOptions): void;
    }

    export default WebWorker;
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent;
    export default component;
}
