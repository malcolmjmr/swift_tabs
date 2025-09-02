// Content script for Swift Tabs
// This file will mount our Svelte app into the page

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

function mount() {
    try {
        cleanup();
        const mountPoint = createMountPoint();

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
