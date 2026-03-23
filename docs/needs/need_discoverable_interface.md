## Need: Discoverable Interface

**Status:** Planned  
**Priority:** Low

---

### Jobs to Be Done

When I'm new to Swift Tabs or need a reminder, I want to **learn and recall the gesture and keyboard system** so that I can **use the extension effectively without consulting external documentation**.

#### Key JTBD Statements:

1. **Main JTBD**: When I first install Swift Tabs, I want to understand the core gestures (Meta-scroll) and keyboard triggers (Space, /) quickly, so I can start using it productively.

2. **Secondary JTBD**: When I forget a shortcut or gesture, I want to access help instantly from within the interface, so I don't need to search documentation.

---

### Current Pain Points (Without Solution)

1. **Hidden Gestures**: Users don't know Meta-scroll is available without being told.
2. **Undiscoverable Keys**: No way to know that `Space` triggers navigation mode or `/` opens find.
3. **No In-App Help**: Must leave the browser to learn how to use the extension.

---

### Desired Outcome

**First-Time Onboarding:**
- Brief overlay or tutorial on first use showing core gestures
- Interactive demo: "Try Meta-scroll now"

**Contextual Help:**
- `?` key opens help overlay with all available shortcuts
- Visual affordances visible in each mode showing valid keys
- Meta symbol (⌘/⊞) in Active Tab Info hints at deeper actions

**Progressive Disclosure:**
- Basic actions obvious; advanced actions discoverable
- No modal dialogs required for core workflow

---

### Success Metrics

1. New user can perform first tab switch within 30 seconds of installation
2. Help overlay accessible in under 1 second (`?` key)
3. No external documentation required for daily use
4. Advanced features (omnibox, find in page) discoverable from help

---

### Related Features

- Feature: Onboarding Overlay (planned)
- Feature: Help Overlay (planned)
- Feature: Active Tab Information (Meta symbol affordance)

---

### Notes

This need is intentionally **deferred** for later implementation. The core Swift Tabs experience (gestures, keyboard modes) should be stable before investing in onboarding infrastructure.

When implemented, should follow the same ergonomic principles: minimal interruption, single-key access, dismissible without friction.

**Potential Approaches:**
- First-run: Minimal overlay with animated gesture demonstration
- Help: `?` opens floating panel showing current mode's available keys
- Hints: Subtle text in UI ("Press Space to navigate") that fades after use
