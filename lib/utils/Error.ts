/**
 * 注册进程级异常处理：统一捕获未处理异常与未处理的 Promise 拒绝，
 * 输出错误后以非零退出码结束进程，避免各入口脚本重复实现。
 */
export function registerErrorHandlers(): void {
    process.on("uncaughtException", (event: unknown) => {
        console.error(event);
        process.exit(1);
    });

    process.on("unhandledRejection", (reason: unknown) => {
        console.error(reason);
        process.exit(1);
    });
}
