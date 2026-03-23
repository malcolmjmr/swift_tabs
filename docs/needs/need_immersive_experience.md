## Need: Immersive Experience

**Status:** Partially Implemented  
**Priority:** Critical

---

### Jobs to Be Done

When I want to focus on content, I want to **browse in fullscreen without seeing any browser chrome** so that I can **work in a distraction-free environment and maximize screen space for the application I'm using**.

#### Key JTBD Statements:

1. **Main JTBD**: When I'm reading, watching, or working in a tab, I want to hide all browser UI elements so I can immerse myself in the content without visual clutter.

2. **Secondary JTBD**: When I need browser controls, I want them to appear on demand and dismiss when I'm done, so the interface doesn't compete with my content for attention.

3. **Tertiary JTBD**: When I'm on a smaller screen, I want to reclaim the space normally used by tabs and toolbars, so I have more room for the actual application.

---

### Current Pain Points (Without Solution)

1. **Constant Chrome Visibility**: Tab bar, address bar, and extensions bar are always visible
2. **Visual Competition**: Browser UI competes with content for attention
3. **Wasted Screen Real Estate**: On laptops and smaller displays, chrome consumes significant space
4. **No Clean Fullscreen**: Browser fullscreen modes still show some elements or require workarounds

---

### Desired Outcome

- Fullscreen browsing where no browser chrome is visible by default
- All browser controls (tab navigation, URL bar, actions) accessible through extension invocation
- Interface components appear only when user triggers them (gesture, keyboard, or mouse)
- Components dismiss automatically when task is complete or user signals done
- Seamless transition between "immersed in content" and "managing browser"

---

### Success Metrics

1. User can achieve a view with zero visible browser chrome
2. Access to any browser function within 1–2 inputs from content-only view
3. Interface elements do not persist on screen after use
4. Fullscreen mode usable as default browsing posture

---

### Related Features

- Feature: Gesture-Based Tab Navigation
- Feature: Windows Overview
- Feature: Active Tab Information Display
- Feature: Omnibox

---

### Notes

This need is the **first value proposition** of Swift Tabs (see [Vision](../vision.md)). Without it, the extension is merely an alternative tab switcher. With it, Swift Tabs enables a fundamentally different browsing posture.

The UI evolution (horizontal → vertical → floating) described in the vision supports this need: each stage moves toward less persistent visibility of controls.
