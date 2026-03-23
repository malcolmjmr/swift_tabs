# Swift Tabs Vision

## Overview

Swift Tabs reimagines the browser interface for a fullscreen, immersive experience. The extension removes the need to see browser chrome while browsing—evolving the paradigm from horizontal tabs and a top toolbar toward a vertical sidebar, and ultimately toward a floating toolbar and interface components that appear only when the user needs them.

---

## Core Value Propositions

### 1. Minimalism: Distraction-Free Browsing

**Principle:** The browser interface should get out of the way so the user can focus on content.

- Fullscreen experience where the user does not see browser chrome
- Interface elements appear on demand and dismiss when done
- No persistent visual clutter—tabs, toolbars, and controls are hidden until invoked
- The content area is the primary visual focus

### 2. Ergonomics: Reduce Mouse Dependency

**Principle:** Minimize the need to move the mouse to interact with browser controls. The mouse is primarily for interacting with application content in the active tab, not for reaching across the screen to click small tab bar targets.

- **Scroll gestures** as a primary input for navigation and actions
- **Keyboard** as the secondary primary input for power users
- Mouse interaction with browser controls is optional and secondary
- Controls are positioned where the user already is—not at screen edges requiring long cursor travel

---

## Input Philosophy

### Few Entry Points, Single-Key Actions

Most applications rely on chorded keyboard shortcuts (e.g., Cmd+Shift+T) that require users to memorize combinations and contort their fingers to hold multiple keys. Swift Tabs takes a different approach:

- **Few entry points:** Easy-to-remember triggers (e.g., Space for navigation mode, `/` for find)
- **Single-key shortcuts:** Within each mode, actions are performed with one key press
- **On-screen affordances:** Valid keys and actions are shown contextually—no need to memorize
- **No chorded shortcuts** as the primary interaction model for core features

### Input Hierarchy

1. **Meta-Scroll Gestures** — Primary for tab (vertical) and window (horizontal) navigation.
2. **Keyboard** — Primary for typing; single-key actions within modes; Arrow keys for navigation.
3. **Mouse** — Optional for browser controls; primarily for page content interaction.

---

## UI Evolution Roadmap

The browser interface is evolving through distinct stages:

| Stage | Description | Swift Tabs Role |
|-------|-------------|-----------------|
| **Current** | Horizontal tab bar, top toolbar | Hide chrome; provide alternative access |
| **Transition** | Vertical toolbar on the side | Support vertical organization; gestures work from any position |
| **Target** | Floating toolbar, on-demand components | Interface appears only when user invokes it; otherwise invisible |

The extension design should support this progression—interfaces should feel lightweight, contextual, and dismissible.

---

## Advanced Capabilities

Beyond the core of minimalism and ergonomics, Swift Tabs addresses:

- **Workspace & tab management** — Organize tabs into named workspaces; switch contexts; save and restore
- **Information management** — LLM-assisted summarization to triage links, tabs, and content without reading everything
- **Omnibox** — Unified search for tabs, URLs, history, bookmarks; command execution
- **Actions** — Save, move, close, and other tab/window operations with minimal friction

These capabilities follow the same principles: minimal UI, ergonomic input, discoverable interactions.

---

## Relationship to Needs

The vision document defines *why* Swift Tabs exists and *how* it should feel. The [User Needs](./needs/needs_overview.md) documents define the specific jobs users hire the extension to perform. All needs should align with and support this vision.
