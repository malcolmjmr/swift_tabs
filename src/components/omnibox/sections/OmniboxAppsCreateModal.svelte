<script>
    import { createEventDispatcher } from "svelte";
    import { countInputWords } from "./omniboxAppsSuggestions.js";

    /** @type {'folder' | 'app'} */
    export let mode = "folder";
    export let open = false;
    export let loadingSuggestions = false;
    /** @type {(string | { name: string, description?: string })[]} */
    export let folderSuggestions = [];
    /** @type {{ label: string, domain: string, description?: string }[]} */
    export let appSuggestions = [];
    export let errorText = "";

    const dispatch = createEventDispatcher();

    let textInput = "";
    let prevOpen = false;

    $: if (open && !prevOpen) {
        textInput = "";
    }
    $: prevOpen = open;

    const inputPlaceholder =
        mode === "folder" ? "Enter folder name" : "Enter app or website name";

    $: wordCount = countInputWords(textInput);
    $: primaryActionLabel =
        mode === "folder"
            ? wordCount <= 2
                ? "Create folder"
                : "Suggest folders"
            : wordCount <= 2
              ? "Add app"
              : "Suggest apps";

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
        if (!raw) return;
        const n = countInputWords(raw);
        if (mode === "folder") {
            if (n <= 2) {
                dispatch("confirm", { kind: "folder", name: raw });
            } else {
                dispatch("goalSuggest", { mode: "folder", goal: raw });
            }
            return;
        }
        if (n <= 2) {
            dispatch("confirm", { kind: "app", domain: raw, title: raw });
        } else {
            dispatch("goalSuggest", { mode: "app", goal: raw });
        }
    }

    /** @param {unknown} entry */
    function pickFolder(entry) {
        const t =
            typeof entry === "string"
                ? entry.trim()
                : String(
                      /** @type {{ name?: string }} */ (entry)?.name ?? "",
                  ).trim();
        if (!t) return;
        dispatch("confirm", { kind: "folder", name: t });
    }

    /** @param {{ label: string, domain: string, description?: string }} row */
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
            <div class="create-modal-body">
                <label class="create-modal-field">
                    <input
                        class="create-modal-input"
                        type="text"
                        placeholder={inputPlaceholder}
                        bind:value={textInput}
                        on:keydown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), submit())}
                    />
                </label>

                {#if loadingSuggestions}
                    <p class="create-modal-hint">Loading suggestions…</p>
                {:else if mode === "folder" && folderSuggestions.length > 0}
                    <div class="create-modal-chips create-modal-chips--stacked">
                        {#each folderSuggestions as s, i (`f-${i}-${typeof s === "string" ? s : s.name}`)}
                            <button
                                type="button"
                                class="create-modal-chip"
                                on:click|stopPropagation={() => pickFolder(s)}
                            >
                                {typeof s === "string"
                                    ? s
                                    : s.name}{#if typeof s !== "string" && s.description}
                                    <span class="create-modal-chip-desc"
                                        >{s.description}</span
                                    >{/if}
                            </button>
                        {/each}
                    </div>
                {:else if mode === "app" && appSuggestions.length > 0}
                    <div class="create-modal-chips create-modal-chips--stacked">
                        {#each appSuggestions as row, ri (`a-${ri}-${row.domain}`)}
                            <button
                                type="button"
                                class="create-modal-chip"
                                on:click|stopPropagation={() => pickApp(row)}
                            >
                                {row.label}
                                {#if row.description}
                                    <span class="create-modal-chip-desc"
                                        >{row.description}</span
                                    >
                                {/if}
                                <span class="create-modal-chip-domain"
                                    >{row.domain}</span
                                >
                            </button>
                        {/each}
                    </div>
                {/if}

                {#if errorText}
                    <p class="create-modal-error" role="alert">{errorText}</p>
                {/if}
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

    .create-modal-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
    }

    .create-modal-chips--stacked .create-modal-chip {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .create-modal-chip-desc {
        display: block;
        font-size: 11px;
        font-weight: 400;
        line-height: 1.35;
        color: var(--st-text-muted, #9a9a9a);
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
