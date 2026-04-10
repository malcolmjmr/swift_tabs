<script>
    import { createEventDispatcher } from "svelte";
    import { chromeService } from "../../services/chromeApi";

    export let tab = null;

    const dispatch = createEventDispatcher();

    let draftUrl = "";
    let lastTabId = null;

    $: if (tab?.id !== lastTabId) {
        lastTabId = tab?.id ?? null;
        draftUrl = tab?.url ?? "";
    }

    async function commit() {
        if (!tab?.id) return;
        const next = draftUrl.trim();
        if (!next) return;
        try {
            await chromeService.updateTabUrl(tab.id, next);
            dispatch("committed");
        } catch (e) {
            console.error(e);
        }
    }

    function onKeydown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            void commit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            dispatch("close");
        }
    }
</script>

{#if tab}
    <div class="active-tab-address" role="dialog" aria-label="Edit tab URL">
        <div class="row">
            <label class="url-label" for="st-active-tab-url">URL</label>
            <input
                id="st-active-tab-url"
                type="text"
                class="url-input"
                bind:value={draftUrl}
                spellcheck="false"
                autocomplete="off"
                on:keydown={onKeydown}
            />
        </div>
        <p class="hint">Press Enter to navigate · Escape to close</p>
    </div>
{/if}

<style>
    .active-tab-address {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999990;
        width: 360px;
        height: 80px;
        padding: 10px 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border-radius: 8px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        font-family: system-ui, sans-serif;
    }

    .row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .url-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-muted, #888);
    }

    .url-input {
        width: 100%;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: rgba(0, 0, 0, 0.25);
        color: var(--st-text-primary, #fff);
        outline: none;
        box-sizing: border-box;
    }

    .url-input:focus {
        border-color: rgba(120, 160, 255, 0.45);
    }

    .hint {
        margin: 0;
        font-size: 11px;
        color: var(--st-text-muted, #808080);
    }
</style>
