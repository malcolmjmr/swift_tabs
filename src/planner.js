import PlannerApp from './PlannerApp.svelte';

const target = document.getElementById('app');
if (target) {
    new PlannerApp({ target });
}
