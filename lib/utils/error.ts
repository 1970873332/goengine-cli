/** 统一捕获未处理异常与 Promise 拒绝，输出错误后以非零码退出 */
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
