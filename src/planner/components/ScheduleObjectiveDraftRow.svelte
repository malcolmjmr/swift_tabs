<script>
    import { createEventDispatcher, onMount, tick } from "svelte";

    /** @type {string} */
    export let draftTempId = "";
    /** @type {boolean} */
    export let requestFocus = false;
    /** @type {boolean} */
    export let disabled = false;

    const dispatch = createEventDispatcher();

    let title = "";
    /** @type {HTMLInputElement|null} */
    let inputEl = null;
    let prevRequestFocus = false;
    /** Skip blur commit when Enter/Tab already handled commit */
    let skipNextBlur = false;

    $: if (requestFocus && !prevRequestFocus) {
        void focusInput();
    }
    $: prevRequestFocus = requestFocus;

    async function focusInput() {
        await tick();
        inputEl?.focus();
        inputEl?.select();
    }

    onMount(() => {
        if (requestFocus) void focusInput();
    });

    /** @param {string} mode */
    function emitCommit(mode) {
        const t = title.trim();
        if (!t) return;
        dispatch("commit", { mode, title: t, draftTempId });
    }

    function emitDismiss() {
        dispatch("dismiss", { draftTempId });
    }

    function onBlur() {
        if (disabled) return;
        if (skipNextBlur) {
            skipNextBlur = false;
            return;
        }
        const t = title.trim();
        if (t) emitCommit("blur");
        else emitDismiss();
    }

    /** @param {KeyboardEvent} e */
    function onKeydown(e) {
        if (disabled) return;
        if (e.key === "Enter") {
            e.preventDefault();
            const t = title.trim();
            if (!t) {
                emitDismiss();
                return;
            }
            skipNextBlur = true;
            dispatch("commit", { mode: "enter", title: t, draftTempId });
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            skipNextBlur = true;
            dispatch("commit", { mode: "tab", title: t, draftTempId });
            return;
        }
        if (e.key === "Backspace" && title === "") {
            e.preventDefault();
            emitDismiss();
        }
    }
</script>

<li class="draft-row" class:draft-row--disabled={disabled}>
    <input
        bind:this={inputEl}
        class="draft-input"
        type="text"
        placeholder="Objective title…"
        bind:value={title}
        {disabled}
        on:blur={onBlur}
        on:keydown={onKeydown}
    />
</li>

<style>
    .draft-row {
        list-style: none;
        margin: 6px 0;
        padding: 8px 10px;
        background-color: rgba(120, 170, 255, 0.12);
        border: 1px dashed rgba(120, 170, 255, 0.45);
        border-radius: 8px;
    }

    .draft-row--disabled {
        opacity: 0.55;
        pointer-events: none;
    }

    .draft-input {
        width: 100%;
        box-sizing: border-box;
        border: none;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--p-text, #e6edf3);
        background: rgba(0, 0, 0, 0.25);
        outline: none;
    }

    .draft-input:focus {
        box-shadow: 0 0 0 2px rgba(120, 170, 255, 0.35);
    }

    .draft-input::placeholder {
        color: var(--p-muted, #8b949e);
    }
</style>
