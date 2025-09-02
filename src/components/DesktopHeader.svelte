<script>
    export let currentWindow;
</script>

<header class="header">
    <h2>{currentWindow?.title || "Window"}</h2>
</header>

<style>
    .header {
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
    }

    .header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }
</style>
