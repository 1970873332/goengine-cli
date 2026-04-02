declare global {
    /**
     * 插槽
     */
    type Slot<P extends Record<any, unknown> = {}> = {
        /**
         * 目标
         */
        target?: ReactNode;
    } & SlotOnlyProps<P>;
    /**
     * 仅属性插槽
     */
    type SlotOnlyProps<P extends Record<any, unknown> = {}> = {
        /**
         * 属性
         */
        props: P;
    };
    /**
     * 提取插槽对象
     */
    type ExtractSlotTarget<T extends Record<any, Slot | SlotOnlyProps>> = {
        [K in keyof T as "target" extends keyof T[K]
            ? K
            : never]?: T[K]["target"];
    };
}

export {};
