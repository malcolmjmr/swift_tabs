# Swift Tabs Vision

## Overview

**Swift Tabs is a Chrome extension that removes browser chrome and replaces mouse-driven tab navigation with scroll-based gestures.** Press Space to see your tabs, scroll to select, Space again to navigate. The interface appears only when you need it, then disappears—giving you a fullscreen, distraction-free browsing experience.

**Why:** Modern browsers force users to constantly hunt and click small targets. Swift Tabs treats the browser as a vehicle for navigating the web, introducing "power steering" for tabs—effortless navigation that responds to intention rather than requiring precise physical manipulation.

---

## Background: Going Chromeless

Two converging trends define the future of computing: the interface is becoming invisible, and interactions are becoming effortless. Swift Tabs sits at this intersection—reimagining the browser as an invisible vehicle for navigating the web.

The conceptual name is **Chromeless**, a recognition that Google Chrome was originally named for its minimal "chrome"—the decorative interface elements of a browser window that should stay out of the way. Chrome was meant to be a sleek vehicle for the information superhighway. Yet modern browsers are cluttered with toolbars, side panels, and persistent UI that demand constant attention. Chromeless fulfills the original promise.

The browser as vehicle metaphor runs deeper than the name. Automobiles evolved through distinct ergonomic stages, each reducing the effort and attention required from the driver:

**Manual steering** required constant physical effort and attention—drivers wrestled with the wheel, calculated every turn, and arrived exhausted from the mental and physical labor. Today's browsers are stuck in this era: users must constantly move the cursor to small targets, click precisely, and fight the interface to accomplish simple tasks.

**Power steering** transformed driving into a light touch activity—the vehicle responds to intention rather than force. Swift Tabs introduces **scroll-to-select** navigation as the browser's power steering: press Space to enter navigation mode, scroll to highlight the desired tab, and press Space again to navigate there. Effortless navigation with minimal input, requiring no precise cursor movement or aiming at small targets.

There is a curious symmetry in this evolution. The first inventor of power steering was a man named Fitts—working out the ergonomics of automobiles decades before his grandson Paul Fitts formalized Fitts' Law, which governs the ergonomics of human-computer interaction. Both Fitts men recognized that systems should adapt to human capabilities, not demand superhuman precision. Fitts' Law states that the time to acquire a target is a function of distance and size; Swift Tabs acknowledges this by eliminating the need to acquire small targets entirely. Navigation happens through scroll gesture—no aiming required.

**Cruise control and self-driving** represent the ultimate evolution—the system understands the journey, removes the need for constant micro-adjustments, and handles execution while the human provides high-level direction. Future versions of Swift Tabs will bring this to browsing: intelligent agents that triage information, summarize content, suggest actions, and execute workflows; automated workspace management and predictive navigation based on patterns. The system maintains the "road conditions" so the user focuses on the destination. The browser becomes not just a vehicle but a navigator and co-pilot.

The interface evolution parallels this progression. Browser chrome progresses from horizontal bars to vertical sidebars to floating elements to complete invisibility, as Don Norman envisioned in *The Invisible Computer*. Meanwhile, interactions progress from mouse dependency to gesture-based navigation to AI-assisted automation. These trends converge: an invisible interface that responds to effortless input, appearing only when needed, with intelligence that anticipates and assists. The goal is to cruise, not to fight the controls.

*Swift Tabs* (the working title) emphasizes the speed and ergonomics of this approach—the same way you don't think about shifting gears when driving, you shouldn't think about interface mechanics when browsing.

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

### 3. User Control: Context-Aware Configurability

**Principle:** The user determines what interface elements appear, when they appear, and how they are arranged. The system adapts to the user, not the other way around.

An interface that displays elements only when needed must be context-aware. But more importantly, it must be *configurable* by the user:

- **Context-specific affordances:** Users define what controls appear in different contexts—reading an article, scanning search results, watching video, filling out forms
- **Arrangement freedom:** With no constraining surface (sidebar, toolbar), users control where elements appear on screen
- **Personalized visibility:** Which elements are essential vs. hidden-behind-gesture is up to the user
- **No enforced layouts:** The system provides sensible defaults, but ultimate authority rests with the user

### 4. Economy and Elegance: Less Is More

**Principle:** An elegant system does more with less. Every element earns its place; every interaction is purposeful.

#### Economy of Information and Interface Components

- No redundant controls or duplicate ways to perform the same action
- No visual noise—every pixel serves a function
- No unnecessary hierarchy; flat structures where possible
- Progressive disclosure: advanced features available but not prominent

#### Economy of Effort

- Single actions, not sequences, for common tasks
- No chorded shortcuts as primary interactions
- Gestures that feel natural, not memorized
- Controls appear where attention already is

---

## Input Philosophy

### Few Entry Points, Single-Key Actions

Most applications rely on chorded keyboard shortcuts (e.g., Cmd+Shift+T) that require users to memorize combinations and contort their fingers to hold multiple keys. Swift Tabs takes a different approach:

- **Few entry points:** Easy-to-remember triggers (e.g., Space for navigation mode, `/` or `?` for shortcuts help when idle; find-in-page `/` in navigation mode is planned)
- **Single-key shortcuts:** Within each mode, actions are performed with one key press
- **On-screen affordances:** Valid keys and actions are shown contextually—no need to memorize
- **No chorded shortcuts** as the primary interaction model for core features

### Input Hierarchy

1. **Meta-Scroll Gestures** — Primary for tab (vertical) and window (horizontal) navigation.
2. **Keyboard** — Primary for typing; single-key actions within modes; Arrow keys for navigation.
3. **Mouse** — Optional for browser controls; primarily for page content interaction.

---

## UI Evolution Roadmap

The browser interface is evolving through four distinct stages, from fixed and persistent to invisible and on-demand—a trajectory Don Norman envisioned in *The Invisible Computer*:

> "The computer of the future should be invisible... It should be embedded in the world around us, serving us without our having to think about it."


| Stage            | Description                            | Swift Tabs Role                                                                    |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| **Current**      | Horizontal tab bar, top toolbar        | Hide chrome; provide alternative access                                            |
| **Transition**   | Vertical sidebar on the side           | Support vertical organization; gestures work from any position                     |
| **Intermediate** | Floating toolbar, on-demand components | Interface appears only when invoked; dismissible after use                         |
| **Target**       | Completely invisible                   | Context-aware system that anticipates needs; interface emerges only when essential |


### The Paradox: Shrinking Interfaces Expand Possibility

As interface elements move from fixed bars to floating, on-demand components, something counterintuitive happens: **the available space for displaying relevant information and providing targeted affordances actually increases.**

A fixed sidebar constrains what can be displayed. But a floating, context-aware interface can:

- Show different affordances for an article (reader mode, save, summarize) than for a SERP (tab management, result ranking, quick filters)
- Adapt to video contexts (playback controls, transcript, chapters) vs. form contexts (autofill, validation, history)
- Present rich previews, actions, and metadata without permanent chrome taking up screen real estate

The constraint of "where on the toolbar" becomes the freedom of "where on the screen" and ultimately "only when needed."

### Requirements for the Floating/Invisible Paradigm

This progression demands two capabilities:

1. **Context awareness:** The system must understand what the user is doing (reading, searching, watching, filling forms) to present relevant affordances
2. **User configurability:** Without a constraining surface, the user must control what appears when—defining contexts like "research mode," "reading mode," "video mode" and arranging controls as they prefer

The extension design should support this progression—interfaces should feel lightweight, contextual, and dismissible.

---

## Advanced Capabilities

Beyond the core of minimalism and ergonomics, Swift Tabs addresses:

- **Workspace & tab management** — Organize tabs into named workspaces; switch contexts; save and restore
- **Information management** — LLM-assisted summarization to triage links, tabs, and content without reading everything
- **Omnibox** — Unified search for tabs, URLs, history, bookmarks; command execution
- **Actions** — Save, move, close, and other tab/window operations with minimal friction
- **Time, task, and activity management** — Beyond tabs, the extension tracks and manages user activities across sessions. Drawing on research in activity-based computing, Swift Tabs evolves into a planning companion that understands context, maintains activity state, and helps users manage their workflow over time

These capabilities follow the same principles: minimal UI, ergonomic input, discoverable interactions.

---

## Relationship to Needs

The vision document defines *why* Swift Tabs exists and *how* it should feel. The [User Needs](./needs/needs_overview.md) documents define the specific jobs users hire the extension to perform. All needs should align with and support this vision.