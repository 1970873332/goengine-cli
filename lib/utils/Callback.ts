import { Stats } from "webpack";

/**
 * webpack 构建回调
 * @param error
 * @param stats
 */
export function webpackBuildCallback(
    error: Error | null,
    stats?: Stats,
    callback?: () => void,
): void {
    if (error) throw console.error("❌ 构建失败:", error);

    if (stats?.hasErrors())
        throw console.error(
            "❌ 构建包含错误:\n",
            stats.toString("errors-only"),
        );

    console.log(
        "✅ 构建成功!\n",
        stats?.toString({
            colors: true,
            chunks: false,
            modules: false,
            children: false,
            version: false,
            hash: false,
            builtAt: false,
        }),
    );

    try {
        callback?.();
    } catch (error: unknown) {
        throw console.error(`❌ 执行回调失败:`, error);
    }
}
