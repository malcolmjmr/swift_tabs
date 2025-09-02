// Content script for Swift Tabs
// This file will mount our Svelte app into the page

const mount = () => {
    const root = document.createElement('div');
    root.id = 'swift-tabs-root';
    document.body.appendChild(root);

    // TODO: Mount Svelte app here once it's built
};

mount();