<script>
    import WindowDots from "./WindowDots.svelte";
    import historyIcon from "../../icons/history.svg";
    import listViewIcon from "../../icons/list-view.svg";
    import { windows, tabStore, activeWindowId } from "../../stores/tabStore";

    function handleWindowSelect({ detail }) {
        // Reset activeTabIndex when switching windows
        activeTabIndex = 0;
    }
</script>

<div class="windows-footer">
    <div class="windows-footer-button">
        <img src={historyIcon} alt="History" />
    </div>
    <div class="expanded-container">
        <WindowDots
            windows={$windows}
            activeWindowId={$activeWindowId}
            on:windowSelect={handleWindowSelect}
        />
    </div>
    <div class="windows-footer-button">
        <img src={listViewIcon} alt="ListView" />
    </div>
</div>

<style>
    .windows-footer {
        background-color: transparent;

        margin: 0px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }
    .expanded-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-grow: 1;
    }

    .windows-footer-button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        padding: 3px;
        margin: 0 5px;
        border-radius: 8px;
        opacity: 0.8;
    }
    .windows-footer-button:hover {
        opacity: 1;
    }
    .windows-footer-button img {
        min-width: 24px;
        min-height: 24px;
        padding: 0px;
        margin: 0px;
    }
</style>
