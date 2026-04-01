<script>
    /** Keyboard shortcuts reference — see App.svelte handleKeydown */
    export let onClose = () => {};
</script>

<div
    class="help-menu"
    role="dialog"
    aria-label="Keyboard shortcuts"
    tabindex="-1"
>
    <div class="help-menu__header">
        <h2 class="help-menu__title">Shortcuts</h2>
        <button
            type="button"
            class="help-menu__close"
            aria-label="Close"
            on:click={onClose}
        >
            ×
        </button>
    </div>
    <div class="help-menu__body">
        <section>
            <h3>Navigation</h3>
            <ul>
                <li><kbd>Space</kbd> (short press) — Enter / exit navigation mode (activate selected tab on release)</li>
                <li><kbd>↑</kbd> <kbd>↓</kbd> — Previous / next tab in window</li>
                <li><kbd>←</kbd> <kbd>→</kbd> — Previous / next window</li>
                <li><kbd>,</kbd> / <kbd>.</kbd> — Back / forward in history</li>
                <li><kbd>⌘</kbd> + scroll — Tab / window navigation (when applicable)</li>
            </ul>
        </section>
        <section>
            <h3>Omnibox</h3>
            <ul>
                <li><kbd>Space</kbd> (hold) — Open omnibox (enters navigation mode if needed)</li>
                <li><kbd>o</kbd> / <kbd>n</kbd> — Open omnibox (enters navigation mode if needed)</li>
                <li>In navigation mode, type any character — Search tabs</li>
            </ul>
        </section>
        <section>
            <h3>Tab menu</h3>
            <ul>
                <li><kbd>a</kbd> / <kbd>m</kbd> — Open tab actions menu</li>
                <li><kbd>⌘</kbd> (hold) — Open tab menu when a tab is available</li>
            </ul>
        </section>
        <section>
            <h3>Group menu</h3>
            <ul>
                <li><kbd>⌥</kbd> (hold) — Open group menu (system menu)</li>
            </ul>
        </section>
        <section>
            <h3>Settings</h3>
            <ul>
                <li><kbd>Ctrl</kbd> (hold) — Open settings (long-press delay, scroll thresholds)</li>
            </ul>
        </section>
        <section>
            <h3>Idle tab actions</h3>
            <p class="help-menu__note">
                When not in navigation mode, omnibox, tab menu, group menu, settings, tab switching overlay,
                or this help panel (no modifier keys except <kbd>?</kbd> as noted):
            </p>
            <ul>
                <li><kbd>Delete</kbd> / <kbd>Backspace</kbd> — Close current tab (when no text is selected)</li>
                <li><kbd>Enter</kbd> — Move current tab to a new window</li>
                <li><kbd>c</kbd> — Copy current tab URL (when no text is selected)</li>
                <li><kbd>r</kbd> — Reload tab</li>
                <li><kbd>i</kbd> — Toggle active tab info strip</li>
                <li><kbd>d</kbd> — Duplicate tab</li>
            </ul>
        </section>
        <section>
            <h3>Help</h3>
            <ul>
                <li><kbd>/</kbd> — Open this panel</li>
                <li><kbd>?</kbd> — Open this panel (Shift + <kbd>/</kbd> on US QWERTY)</li>
                <li><kbd>Escape</kbd> — Close</li>
            </ul>
        </section>
        <section>
            <h3>Selection</h3>
            <ul>
                <li><kbd>c</kbd> — Copy selection</li>
                <li><kbd>g</kbd> — Google search for selection</li>
            </ul>
        </section>
    </div>
</div>

<style>
    .help-menu {
        position: fixed;
        bottom: 100px;
        right: 20px;
        z-index: 999992;
        max-width: min(420px, calc(100vw - 40px));
        max-height: min(70vh, 520px);
        overflow: auto;
        padding: 16px 20px;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.97));
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        color: var(--st-text-primary, #e8e8e8);
        font-size: 13px;
        line-height: 1.45;
    }

    .help-menu__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .help-menu__title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .help-menu__close {
        font-size: 22px;
        line-height: 1;
        color: var(--st-text-secondary, #b0b0b0);
        cursor: pointer;
        padding: 4px 8px;
    }

    .help-menu__close:hover {
        color: var(--st-text-primary, #fff);
    }

    .help-menu__body section {
        margin-bottom: 14px;
    }

    .help-menu__body h3 {
        margin: 0 0 6px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--st-text-secondary, #a0a0a0);
    }

    .help-menu__body ul {
        margin: 0;
        padding-left: 18px;
    }

    .help-menu__body li {
        margin-bottom: 4px;
    }

    .help-menu__note {
        margin: 0 0 8px;
        font-size: 12px;
        color: var(--st-text-secondary, #b0b0b0);
    }

    .help-menu kbd {
        display: inline-block;
        padding: 1px 5px;
        font-size: 11px;
        font-family: ui-monospace, monospace;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }
</style>
