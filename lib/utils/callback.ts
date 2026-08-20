import { Stats } from "webpack";

/** webpack 构建回调：失败退出，成功时执行可选回调 */
export function webpackBuildCallback(
    error: Error | null,
    stats?: Stats,
    callback?: () => void,
): void {
    if (error) {
        console.error("❌ 构建失败:", error);
        process.exit(1);
    }

    if (stats?.hasErrors()) {
        console.error("❌ 构建包含错误:\n", stats.toString("errors-only"));
        process.exit(1);
    }

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
        console.error(`❌ 执行回调失败:`, error);
        process.exit(1);
    }
}
