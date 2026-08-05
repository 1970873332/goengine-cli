export async function runWithConcurrency<T>(
    items: T[],
    handler: (item: T) => Promise<void>,
    concurrency: number,
): Promise<{ results: PromiseSettledResult<void>[]; items: T[] }> {
    const results: PromiseSettledResult<void>[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
        // 创建一个包装 promise，同时追踪状态
        const promise = handler(item);

        // 保存原始 promise 的引用
        const wrappedPromise = promise
            .then(
                () => ({ status: "fulfilled" as const, value: undefined }),
                (reason) => ({ status: "rejected" as const, reason }),
            )
            .then((result) => {
                // 当这个 promise 完成时，从 executing 数组中移除
                const index = executing.indexOf(wrappedPromise);
                if (index !== -1) {
                    executing.splice(index, 1);
                }
                results.push(result);
            });

        executing.push(wrappedPromise);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }

    // 等待所有剩余的 promise 完成
    await Promise.allSettled(executing);

    return { results, items };
}

export function formatResults<T>(
    results: PromiseSettledResult<void>[],
    items: T[],
    getItemName: (item: T) => string,
): { success: number; failed: number; details: string[] } {
    const details: string[] = [];
    let success = 0;
    let failed = 0;

    results.forEach((result, index) => {
        const name = getItemName(items[index]);
        if (result.status === "fulfilled") {
            success++;
            details.push(`✅ ${name}`);
        } else {
            failed++;
            details.push(`❌ ${name}`);
            details.push(`   Error: ${result.reason.message}`);
        }
    });

    return { success, failed, details };
}
