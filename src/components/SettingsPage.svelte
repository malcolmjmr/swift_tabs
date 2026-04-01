<script>
    /**
     * Swift Tabs settings — long-press delay and scroll thresholds for tab/window switching.
     */
    export let settings = {};
    /** @type {(patch: Record<string, number>) => void} */
    export let onChange = () => {};
    export let onClose = () => {};

    function patch(field, raw) {
        const n = Number(raw);
        if (Number.isNaN(n)) return;
        onChange({ [field]: n });
    }
</script>

<div
    class="settings-page"
    role="dialog"
    aria-label="Settings"
    tabindex="-1"
>
    <div class="settings-page__header">
        <h2 class="settings-page__title">Settings</h2>
        <button
            type="button"
            class="settings-page__close"
            aria-label="Close"
            on:click={onClose}
        >
            ×
        </button>
    </div>
    <div class="settings-page__body">
        <section>
            <label class="settings-page__label" for="lp-delay">
                Long-press delay
                <span class="settings-page__value">{settings.longPressDelayMs ?? 500} ms</span>
            </label>
            <input
                id="lp-delay"
                type="range"
                min="100"
                max="1500"
                step="50"
                value={settings.longPressDelayMs ?? 500}
                on:input={(e) => patch("longPressDelayMs", e.currentTarget.value)}
            />
            <p class="settings-page__hint">
                Used for Space (omnibox), ⌘ (tab menu), ⌥ (group menu), and ⌃ (this panel).
            </p>
        </section>
        <section>
            <label class="settings-page__label" for="scroll-v">
                Vertical scroll threshold
                <span class="settings-page__value">{settings.scrollVerticalThreshold ?? 33}</span>
            </label>
            <input
                id="scroll-v"
                type="range"
                min="5"
                max="200"
                step="1"
                value={settings.scrollVerticalThreshold ?? 33}
                on:input={(e) =>
                    patch("scrollVerticalThreshold", e.currentTarget.value)}
            />
            <p class="settings-page__hint">
                Accumulated wheel delta before switching tabs (navigation mode, vertical scroll).
            </p>
        </section>
        <section>
            <label class="settings-page__label" for="scroll-h">
                Horizontal scroll threshold
                <span class="settings-page__value">{settings.scrollHorizontalThreshold ?? 33}</span>
            </label>
            <input
                id="scroll-h"
                type="range"
                min="5"
                max="200"
                step="1"
                value={settings.scrollHorizontalThreshold ?? 33}
                on:input={(e) =>
                    patch("scrollHorizontalThreshold", e.currentTarget.value)}
            />
            <p class="settings-page__hint">
                Accumulated wheel delta before switching windows / carousel slides (horizontal scroll).
            </p>
        </section>
    </div>
</div>

<style>
    .settings-page {
        position: fixed;
        bottom: 100px;
        right: 20px;
        z-index: 999993;
        max-width: min(420px, calc(100vw - 40px));
        padding: 16px 20px;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.97));
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        color: var(--st-text-primary, #e8e8e8);
        font-size: 13px;
        line-height: 1.45;
    }

    .settings-page__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .settings-page__title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .settings-page__close {
        font-size: 22px;
        line-height: 1;
        color: var(--st-text-secondary, #b0b0b0);
        cursor: pointer;
        padding: 4px 8px;
    }

    .settings-page__close:hover {
        color: var(--st-text-primary, #fff);
    }

    .settings-page__body section {
        margin-bottom: 16px;
    }

    .settings-page__body section:last-child {
        margin-bottom: 0;
    }

    .settings-page__label {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-secondary, #a0a0a0);
    }

    .settings-page__value {
        font-family: ui-monospace, monospace;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        color: var(--st-text-primary, #e8e8e8);
    }

    .settings-page__body input[type="range"] {
        width: 100%;
        margin: 0;
        accent-color: rgba(120, 180, 255, 0.9);
    }

    .settings-page__hint {
        margin: 8px 0 0;
        font-size: 11px;
        color: var(--st-text-secondary, #888);
    }
</style>
