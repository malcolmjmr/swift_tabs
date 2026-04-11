<script>
    export let ariaLabel = "Add";
    export let onActivate = () => {};
</script>

<div class="apps-icon-slot apps-icon-slot--add" role="group" aria-label={ariaLabel}>
    <button
        type="button"
        class="apps-icon-tile apps-icon-tile--add"
        aria-label={ariaLabel}
        on:click|stopPropagation={() => onActivate()}
    >
        <span class="material-symbols-rounded apps-icon-tile-add-glyph">add</span>
    </button>
    <span class="apps-icon-slot-title apps-icon-slot-title--add">Add</span>
</div>

<style>
    .apps-icon-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        width: 76px;
        max-width: 76px;
    }

    .apps-icon-tile {
        box-sizing: border-box;
        width: 76px;
        height: 76px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        max-width: 76px;
        padding: 6px 2px 8px;
        border: none;
        background-color: #222;
        border-radius: 14px;
        cursor: pointer;
        color: var(--st-text-primary, #fff);
        font-family: inherit;
        transition: background 0.12s;
    }

    .apps-icon-tile--add:hover {
        background: var(--st-bg-secondary, rgba(255, 255, 255, 0.1));
    }

    .apps-icon-tile-add-glyph {
        font-size: 40px;
        line-height: 1;
        color: var(--st-text-muted, #aaa);
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 48;
        user-select: none;
    }

    .apps-icon-slot-title {
        width: 100%;
        margin: 0;
        padding: 0 2px;
        font-size: 10px;
        line-height: 1.25;
        text-align: center;
        color: var(--st-text-muted, #aaa);
        font-family: inherit;
    }
</style>
