
import App from './App.svelte';

function createMountPoint() {
    const existingRoot = document.getElementById('swift-tabs-root');
    if (existingRoot) {
        return existingRoot;
    }

    const root = document.createElement('div');
    root.id = 'swift-tabs-root';
    document.body.appendChild(root);
    return root;
}

let app = null;

function cleanup() {
    if (app) {
        app.$destroy();
        app = null;
    }
}

function addHeaderLinks() {
    const materialSymbolsLink = document.createElement('link');
    materialSymbolsLink.rel = 'stylesheet';
    materialSymbolsLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(materialSymbolsLink);
}

function mount() {
    try {
        cleanup();
        const mountPoint = createMountPoint();
        addHeaderLinks();
        app = new App({
            target: mountPoint
        });
    } catch (error) {
        console.error('Failed to mount Swift Tabs:', error);
    }
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}

// Cleanup on navigation
window.addEventListener('unload', cleanup);
