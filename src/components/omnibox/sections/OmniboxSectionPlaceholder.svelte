<script>
    export let sectionId = "";
    export let message = "Not available yet";
    export let isActiveSlide = false;

    /** @param {KeyboardEvent} event */
    export function handleOmniboxKeydown(event) {
        if (!isActiveSlide) return false;
        if (
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight"
        ) {
            event.preventDefault();
            return true;
        }
        return false;
    }
</script>

<div class="empty-state" data-section-placeholder={sectionId}>
    {message}
</div>

<style>
    .empty-state {
        padding: 24px 16px;
        color: var(--st-text-muted, #888);
        font-size: 14px;
        text-align: center;
    }
</style>
