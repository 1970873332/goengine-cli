export async function runWithConcurrency<T>(
    items: T[],
    handler: (item: T) => Promise<void>,
    concurrency: number,
): Promise<{ results: PromiseSettledResult<void>[]; items: T[] }> {
    const results: PromiseSettledResult<void>[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
        const promise = handler(item);

        const wrappedPromise = promise
            .then(
                () => ({ status: "fulfilled" as const, value: undefined }),
                (reason) => ({ status: "rejected" as const, reason }),
            )
            .then((result) => {
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
