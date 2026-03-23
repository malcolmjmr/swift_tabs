<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { chromeService } from "../services/chromeApi";

    export let query = "";
    let inputEl;

    onMount(() => {
        inputEl?.focus();
    });

    const dispatch = createEventDispatcher();

    function isUrlLike(str) {
        const trimmed = str.trim();
        if (!trimmed) return false;
        if (/^https?:\/\//i.test(trimmed)) return true;
        if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return true;
        if (trimmed.includes(".") && !trimmed.includes(" ")) return true;
        return false;
    }

    function resolveUrl(input) {
        const trimmed = input.trim();
        if (!trimmed) return null;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return "https://" + trimmed;
    }

    function handleKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            submit();
        } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            dispatch("close");
        }
    }

    async function submit() {
        const trimmed = query.trim();
        if (!trimmed) {
            dispatch("close");
            return;
        }

        const url = isUrlLike(trimmed)
            ? resolveUrl(trimmed)
            : "https://www.google.com/search?q=" + encodeURIComponent(trimmed);

        await chromeService.createTab({ url, active: true });
        dispatch("submit");
        dispatch("close");
    }
</script>

<div class="omnibox-overlay" role="dialog" aria-modal="true" aria-label="Search or enter URL">
    <div class="omnibox-container">
        <input
            bind:this={inputEl}
            type="text"
            class="omnibox-input"
            placeholder="Search or enter URL"
            bind:value={query}
            on:keydown={handleKeydown}
        />
    </div>
</div>

<style>
    .omnibox-overlay {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000001;
        pointer-events: auto;
    }

    .omnibox-container {
        background: #333;
        border-radius: 8px;
        padding: 8px 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        min-width: 400px;
        max-width: 600px;
    }

    .omnibox-input {
        width: 100%;
        font-size: 16px;
        border: none;
        outline: none;
        background: transparent;
        color: white;
        padding: 4px 0;
    }

    .omnibox-input::placeholder {
        color: #888;
    }
</style>
