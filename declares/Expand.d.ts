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
     * 迭代
     */
    type Iteration = string | number | symbol;

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
        type resolveFunc<T, A extends unknown[] = unknown[]> =
            | T
            | ((...args: A) => T);
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
        type RecordCallBack<T, B = void> = (nv: T, ov?: T) => B;
    }

    /**
     * 提取
     */
    namespace Extract {
        /**
         * 属性
         */
        type Property<
            T extends Record<any, unknown>,
            P extends keyof T[keyof T],
        > = {
            [K in keyof T]?: T[K] extends Record<P, infer U> ? U : never;
        };
        /**
         * 所有属性
         */
        type Properties<T> = {
            [K in keyof T as T[K] extends Function ? never : K]: T[K];
        };
    }

    /**
     * 重构
     */
    namespace Refactor {
        /**
         * 合并部分覆盖
         */
        type MergePartialOverride<T, U extends Partial<T>> = Omit<T, keyof U> &
            U;
    }

    /**
     * 实例
     */
    type Instance<T> = new (...args: any[]) => T;
}

export {};
