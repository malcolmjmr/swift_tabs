import NewTabPage from "./NewTabPage.svelte";

const target = document.getElementById("app");
if (target) {
    new NewTabPage({ target });
}
