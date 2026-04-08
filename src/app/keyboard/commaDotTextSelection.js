/**
 * @param {KeyboardEvent} event
 * @param {object} ctx
 * @returns {Promise<boolean>}
 */
export async function tryCommaDotAndTextSelection(event, ctx) {
    const { chromeService } = ctx;

    if (event.key === ",") {
        event.preventDefault();
        event.stopPropagation();
        history.back();
        return true;
    }
    if (event.key === ".") {
        event.preventDefault();
        event.stopPropagation();
        try {
            const res = await chromeService.linkQueueNavigateNext();
            if (!res?.opened) history.forward();
        } catch {
            history.forward();
        }
        return true;
    }

    const textSelection = window.getSelection().toString();
    if (textSelection.length > 0) {
        if (event.key === "c") {
            navigator.clipboard.writeText(textSelection);
        }
        if (event.key === "g") {
            window.open(
                "https://www.google.com/search?q=" + textSelection,
            );
        }
    }
    return false;
}
