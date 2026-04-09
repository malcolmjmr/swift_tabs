/**
 * Vertical move-mode: one step for the whole selection (same idea as horizontal
 * batch move). Contiguous runs use one neighbor-shuffle; scattered multi-select
 * moves each tab one slot in a stable index order.
 * @param {{ moveTabWithinWindow: (id: number, d: number) => Promise<unknown> }} tabStore
 * @param {chrome.tabs.Tab[]} tabsSorted
 * @param {chrome.tabs.Tab[]} batch Sorted by index (from targetTabsForNavBatch)
 * @param {number} dir +1 toward higher index, -1 toward lower
 */
export async function applyVerticalMoveForSelection(
    tabStore,
    tabsSorted,
    batch,
    dir,
) {
    if (!batch.length) return;
    if (batch.length === 1) {
        await tabStore.moveTabWithinWindow(batch[0].id, dir);
        return;
    }

    const withIdx = batch
        .map((t) => ({
            id: t.id,
            idx: tabsSorted.findIndex((x) => x.id === t.id),
        }))
        .filter((x) => x.idx >= 0)
        .sort((a, b) => a.idx - b.idx);

    if (withIdx.length === 0) return;

    let contiguous = true;
    for (let k = 1; k < withIdx.length; k++) {
        if (withIdx[k].idx !== withIdx[k - 1].idx + 1) {
            contiguous = false;
            break;
        }
    }

    if (!contiguous) {
        const ordered =
            dir > 0
                ? [...withIdx].sort((a, b) => b.idx - a.idx)
                : [...withIdx].sort((a, b) => a.idx - b.idx);
        for (const { id } of ordered) {
            await tabStore.moveTabWithinWindow(id, dir);
        }
        return;
    }

    const minI = withIdx[0].idx;
    const maxI = withIdx[withIdx.length - 1].idx;
    if (dir > 0) {
        if (maxI >= tabsSorted.length - 1) return;
        const belowId = tabsSorted[maxI + 1].id;
        const steps = maxI + 1 - minI;
        for (let s = 0; s < steps; s++) {
            await tabStore.moveTabWithinWindow(belowId, -1);
        }
    } else {
        if (minI <= 0) return;
        const aboveId = tabsSorted[minI - 1].id;
        const steps = maxI - (minI - 1);
        for (let s = 0; s < steps; s++) {
            await tabStore.moveTabWithinWindow(aboveId, 1);
        }
    }
}
