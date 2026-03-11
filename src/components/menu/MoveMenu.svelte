<script>
    import { createEventDispatcher } from "svelte";

    export let windows = [];

    const dispatch = createEventDispatcher();

    function close() {
        dispatch("close");
    }

    function moveTo(windowId) {
        dispatch("moveTab", { windowId });
    }
</script>

<div
    class="overlay"
    role="dialog"
    aria-modal="true"
    tabindex="0"
    on:click|self={close}
    on:keydown={(e) => (e.key === "Escape" || e.key === "Enter") && close()}
>
    <div class="menu">
        <div class="menu-header">
            <h3>Move tab to...</h3>
            <button class="close-btn" on:click={close}>✕</button>
        </div>
        <div class="menu-list">
            {#each windows as w (w.id)}
                <button class="menu-item" on:click={() => moveTo(w.id)}>
                    {w.title || `Window ${w.id}`}
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
    }

    .menu {
        width: 260px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 12px;
    }

    .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .menu-header h3 {
        margin: 0;
        font-size: 14px;
    }

    .close-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 16px;
        color: #666;
    }

    .menu-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 300px;
        overflow: auto;
    }

    .menu-item {
        width: 100%;
        text-align: left;
        padding: 8px 10px;
        border: none;
        border-radius: 6px;
        background: #f2f2f2;
        cursor: pointer;
    }

    .menu-item:hover {
        background: #e6e6e6;
    }
</style>
