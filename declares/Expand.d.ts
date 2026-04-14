global {
    /**
     * 结构化可克隆属性
     */
    type StructuredCloneable =
        | string
        | number
        | boolean
        | null
        | undefined
        | bigint
        | Date
        | RegExp
        | ArrayBuffer
        | Blob
        | File
        | ImageBitmap
        | ReadonlyArray<StructuredCloneable>
        | Readonly<Record<any, StructuredCloneable>>
        | Map<StructuredCloneable, StructuredCloneable>
        | Set<StructuredCloneable>;

    /**
     * 可变
     */
    type Mutable<T> = { -readonly [P in keyof T]: T[P] };

    /**
     * 推断
     */
    namespace Infer {
        /**
         * 联合类型
         */
        type Unite<T> = T extends infer U ? U : never;
    }

    /**
     * 多态
     */
    namespace Poly {
        /**
         * 函数返回值
         */
        type resolveFunc<T> = T | ((...args: unknown[]) => T);
    }

    /**
     * 变体
     */
    namespace Variant {
        /**
         * 忽略
         */
        type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
    }

    /**
     * 函数
     */
    namespace Func {
        /**
         * 回调
         */
        type CallBack<T, B extends any = void> = (value: T) => B;
        /**
         * 记录回调
         */
        type RecordCallBack<T, B extends any = void> = (
            prev: T | undefined,
            next: T,
        ) => B;
    }

    /**
     * 提取
     */
    namespace Extract {
        /**
         * 提取属性
         */
        type ExtractProperty<
            T extends Record<any, unknown>,
            P extends keyof T[keyof T],
        > = {
            [K in keyof T]?: T[K] extends Record<P, infer U> ? U : never;
        };
    }
}

export {};
