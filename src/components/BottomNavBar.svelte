<script>
    import addIcon from "../icons/add.svg";
    import tabIcon from "../icons/tab.svg";
    import windowsIcon from "../icons/windows.svg";
    import tasksIcon from "../icons/flag.svg";
    import chatIcon from "../icons/chat.svg";
    import menuIcon from "../icons/menu.svg";
    export let view = "windows";
</script>

<div class="bottom-nav-bar">
    <button
        class={view === "open" ? "active" : ""}
        on:click={() => (view = "open")}><img src={addIcon} alt="All" /></button
    >
    <div class="middle-buttons">
        <button
            class={view === "tab" ? "active" : ""}
            on:click={() => (view = "tab")}
            ><img src={tabIcon} alt="Tab" /></button
        >
        <button
            class={view === "windows" ? "active" : ""}
            on:click={() => (view = "windows")}
            ><img src={windowsIcon} alt="Windows" /></button
        >

        <button
            class={view === "tasks" ? "active" : ""}
            on:click={() => (view = "tasks")}
            ><img src={tasksIcon} alt="Task" /></button
        >
        <button
            class={view === "chat" ? "active" : ""}
            on:click={() => (view = "chat")}
            ><img src={chatIcon} alt="Chat" /></button
        >
    </div>
    <button
        class={view === "menu" ? "active" : ""}
        on:click={() => (view = "menu")}
        ><img src={menuIcon} alt="Menu" /></button
    >
</div>

<style>
    .bottom-nav-bar {
        display: flex;

        justify-content: space-between;
        align-items: center;
        background-color: #444;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border-radius: 12px;
    }
    .bottom-nav-bar button {
        background: none;
        border: none;
        cursor: pointer;
        height: 30px;
        width: 30px;
        opacity: 0.5;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    button:hover {
        opacity: 1;
    }

    .middle-buttons {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        display: flex;

        border-left: 1px solid #555;
        border-right: 1px solid #555;
    }

    .middle-buttons button {
        margin: 0 5px;
        padding: 0 5px;
    }

    button.active {
        opacity: 1;
    }
</style>
