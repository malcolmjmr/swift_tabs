<script>
    import { createEventDispatcher } from "svelte";

    /** @type {'folder' | 'app'} */
    export let mode = "folder";
    export let open = false;
    export let loadingSuggestions = false;
    /** @type {string[]} */
    export let folderSuggestions = [];
    /** @type {{ label: string, domain: string }[]} */
    export let appSuggestions = [];
    export let errorText = "";

    const dispatch = createEventDispatcher();

    let textInput = "";
    let prevOpen = false;

    $: if (open && !prevOpen) {
        textInput = "";
    }
    $: prevOpen = open;

    $: dialogTitle =
        mode === "folder" ? "New folder" : "Add app";
    $: inputLabel =
        mode === "folder" ? "Folder name" : "Domain or URL";
    $: inputPlaceholder =
        mode === "folder"
            ? "e.g. Work projects"
            : "e.g. github.com or https://…";

    function onBackdropPointerDown(e) {
        if (e.target === e.currentTarget) dispatch("close");
    }

    /** @param {KeyboardEvent} e */
    function onDialogKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            dispatch("close");
        }
    }

    function submit() {
        const raw = textInput.trim();
        if (mode === "folder") {
            if (!raw) return;
            dispatch("confirm", { kind: "folder", name: raw });
            return;
        }
        if (!raw) return;
        dispatch("confirm", { kind: "app", domain: raw, title: raw });
    }

    /** @param {unknown} name */
    function pickFolder(name) {
        const t = String(name ?? "").trim();
        if (!t) return;
        dispatch("confirm", { kind: "folder", name: t });
    }

    /** @param {{ label: string, domain: string }} row */
    function pickApp(row) {
        dispatch("confirm", {
            kind: "app",
            domain: row.domain,
            title: row.label || row.domain,
        });
    }
</script>

{#if open}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="create-modal-backdrop"
        role="presentation"
        on:pointerdown={onBackdropPointerDown}
    >
        <div
            class="create-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
            on:pointerdown|stopPropagation
            on:keydown={onDialogKeydown}
        >
            <header class="create-modal-header">
                <h2 id="create-modal-title" class="create-modal-title">
                    {dialogTitle}
                </h2>
                <button
                    type="button"
                    class="create-modal-icon-btn"
                    aria-label="Close"
                    on:click={() => dispatch("close")}
                >
                    <span class="material-symbols-rounded">close</span>
                </button>
            </header>
            <div class="create-modal-body">
                {#if loadingSuggestions}
                    <p class="create-modal-hint">Loading suggestions…</p>
                {:else if mode === "folder" && folderSuggestions.length > 0}
                    <p class="create-modal-section-label">Suggested folders</p>
                    <div class="create-modal-chips">
                        {#each folderSuggestions as s, i (`f-${i}-${s}`)}
                            <button
                                type="button"
                                class="create-modal-chip"
                                on:click|stopPropagation={() =>
                                    pickFolder(s)}>{s}</button>
                        {/each}
                    </div>
                {:else if mode === "app" && appSuggestions.length > 0}
                    <p class="create-modal-section-label">Suggested apps</p>
                    <div class="create-modal-chips create-modal-chips--apps">
                        {#each appSuggestions as row, ri (`a-${ri}-${row.domain}`)}
                            <button
                                type="button"
                                class="create-modal-chip"
                                on:click|stopPropagation={() => pickApp(row)}
                            >
                                {row.label}<span class="create-modal-chip-domain"
                                    >{row.domain}</span>
                            </button>
                        {/each}
                    </div>
                {/if}

                <label class="create-modal-field">
                    <span class="create-modal-field-label">{inputLabel}</span>
                    <input
                        class="create-modal-input"
                        type="text"
                        placeholder={inputPlaceholder}
                        bind:value={textInput}
                        on:keydown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), submit())}
                    />
                </label>

                {#if errorText}
                    <p class="create-modal-error" role="alert">{errorText}</p>
                {/if}

                <div class="create-modal-actions">
                    <button
                        type="button"
                        class="create-modal-btn create-modal-btn--ghost"
                        on:click={() => dispatch("close")}>Cancel</button>
                    <button
                        type="button"
                        class="create-modal-btn create-modal-btn--primary"
                        disabled={!textInput.trim()}
                        on:click={submit}>Create</button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .create-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
    }

    .create-modal-dialog {
        display: flex;
        flex-direction: column;
        width: min(380px, 100%);
        max-height: min(80vh, 560px);
        border-radius: 16px;
        background: var(--st-bg-primary, #1a1a1a);
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.1));
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .create-modal-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 10px 10px 14px;
        border-bottom: 1px solid
            var(--st-border-color, rgba(255, 255, 255, 0.08));
    }

    .create-modal-title {
        flex: 1;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--st-text-primary, #fff);
    }

    .create-modal-icon-btn {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--st-text-primary, #fff);
        cursor: pointer;
        font-family: inherit;
    }

    .create-modal-icon-btn:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.08));
    }

    .create-modal-icon-btn .material-symbols-rounded {
        font-size: 22px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
    }

    .create-modal-body {
        padding: 14px 14px 16px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .create-modal-hint {
        margin: 0 0 12px;
        font-size: 13px;
        color: var(--st-text-muted, #888);
    }

    .create-modal-section-label {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--st-text-muted, #aaa);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .create-modal-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
    }

    .create-modal-chips--apps .create-modal-chip {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .create-modal-chip-domain {
        display: block;
        font-size: 10px;
        font-weight: 400;
        color: var(--st-text-muted, #888);
    }

    .create-modal-chip {
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.06));
        color: var(--st-text-primary, #eee);
        font-size: 13px;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
    }

    .create-modal-chip:hover {
        background: var(--st-bg-hover, rgba(255, 255, 255, 0.1));
    }

    .create-modal-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
    }

    .create-modal-field-label {
        font-size: 12px;
        color: var(--st-text-muted, #aaa);
    }

    .create-modal-input {
        box-sizing: border-box;
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.15));
        background: rgba(0, 0, 0, 0.25);
        color: var(--st-text-primary, #fff);
        font-size: 14px;
        font-family: inherit;
    }

    .create-modal-input:focus {
        outline: 2px solid rgba(100, 160, 255, 0.45);
        outline-offset: 1px;
    }

    .create-modal-error {
        margin: 0 0 12px;
        font-size: 13px;
        color: #f88;
    }

    .create-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
    }

    .create-modal-btn {
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        cursor: pointer;
        border: 1px solid transparent;
    }

    .create-modal-btn--ghost {
        background: transparent;
        border-color: var(--st-border-color, rgba(255, 255, 255, 0.15));
        color: var(--st-text-primary, #ddd);
    }

    .create-modal-btn--primary {
        background: rgba(80, 120, 220, 0.35);
        border-color: rgba(120, 160, 255, 0.4);
        color: var(--st-text-primary, #fff);
    }

    .create-modal-btn--primary:disabled {
        opacity: 0.45;
        cursor: default;
    }
</style>
