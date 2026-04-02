<script>
    /** Audio / mute only; active and last-active use borders on the parent row/tile. */
    export let tab;

    /** "inline" = row after title; "overlay" = corner on favicon tile */
    export let variant = "inline";

    $: isMuted = !!tab?.mutedInfo?.muted;
    $: isAudible = !!tab?.audible;
    $: showAudio = isMuted || isAudible;
</script>

{#if showAudio && variant === "overlay"}
    <div class="badges-overlay" aria-hidden="true">
        {#if isMuted}
            <span class="badge badge-audio material-symbols-rounded" title="Muted">volume_off</span>
        {:else if isAudible}
            <span class="badge badge-audio material-symbols-rounded" title="Playing audio"
                >volume_up</span
            >
        {/if}
    </div>
{:else if showAudio}
    <div class="badges-inline" role="group" aria-label="Tab audio status">
        {#if isMuted}
            <span
                class="badge-inline material-symbols-rounded"
                title="Muted"
                aria-label="Muted">volume_off</span
            >
        {:else if isAudible}
            <span
                class="badge-inline material-symbols-rounded"
                title="Playing audio"
                aria-label="Playing audio">volume_up</span
            >
        {/if}
    </div>
{/if}


<style>
    .badges-inline {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
        font-size: 16px;
        color: var(--st-text-muted, #a0a0a0);
        min-width: 0;
    }

    .badge-inline {
        font-size: 16px;
        font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 20;
        line-height: 1;
        user-select: none;
    }

    .badges-overlay {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: flex-start;
        gap: 0;
        max-width: 40px;
        pointer-events: none;
        z-index: 1;
    }

    .badge {
        font-size: 12px;
        line-height: 1;
        background: var(--st-bg-primary, rgba(30, 30, 30, 0.95));
        border: 1px solid var(--st-border-color, rgba(255, 255, 255, 0.12));
        border-radius: 3px;
        padding: 1px;
        color: var(--st-text-muted, #c0c0c0);
        font-variation-settings:
            "FILL" 0,
            "wght" 500,
            "GRAD" 0,
            "opsz" 20;
    }

    .badge-audio {
        font-size: 11px;
    }
</style>
