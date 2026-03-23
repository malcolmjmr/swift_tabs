# User Needs Overview

## Swift Tabs Chrome Extension

This document catalogs the core user needs that drive the development of Swift Tabs. Each need represents a fundamental "Job to Be Done" (JTBD) that users hire this extension to perform.

**Vision:** See [Vision](../vision.md) for the product's core value propositions (minimalism, ergonomics) and design philosophy.

---

## Needs Catalog

| Need ID | Need Name | JTBD Summary | Status |
|---------|-----------|--------------|--------|
| **Tier 0: Vision-Aligned** |
| 0a | [Immersive Experience](./need_immersive_experience.md) | Fullscreen browsing; interface appears on navigation or scroll up | Partially Implemented |
| 0b | [Ergonomic Input Primacy](./need_ergonomic_input_primacy.md) | Scroll for navigation, keyboard for modes/menus; no mouse hunting | Partially Implemented |
| **Tier 1: Core** |
| 1 | [Efficient Tab Navigation](./need_efficient_tab_navigation.md) | Flip through tabs (vertical) and windows (horizontal) with Meta-Scroll | Implemented |
| 2 | [Tab Context Awareness](./need_tab_context_awareness.md) | See active tab info upon navigation; shows Meta symbol affordance | Implemented |
| 3 | [Tab Management](./need_tab_management.md) | Access, navigate, search, and perform actions on tabs | Partially Implemented |
| 4 | [Window and Group Management](./need_window_management.md) | Navigate windows and tab groups; dot indicators in TabsView | Partially Implemented |
| **Tier 2: Supporting (Browser Table Stakes)** |
| 5 | [Quick Recovery](./need_quick_recovery.md) | Undo accidental tab closures without disruption | Planned |
| 6 | [Duplicate Prevention](./need_duplicate_prevention.md) | Detect and prevent duplicate tabs from cluttering workspace | Planned |
| 7 | [Audio Management](./need_audio_management.md) | See and control audio-playing tabs at a glance | Planned |
| 8 | [URL Manipulation](./need_url_manipulation.md) | Quickly edit, clean, or navigate URL variants | Planned |
| **Tier 3: Enhancement** |
| 9 | [Workspace Management](./need_workspace_management.md) | Save, suspend, resume named workspaces with multiple tabs | Planned |
| 10 | [Find in Page](./need_find_in_page.md) | Quick in-page search with `/` key; navigate matches with single keys | Planned |
| 11 | [Information Summarization](./need_information_summarization.md) | AI-assisted summarization of links, tabs, and sessions for triage | Planned |
| 12 | [Task Management](./need_task_management.md) | Save tabs to tasks, schedule reading, focus mode for deep work | Planned |
| 13 | [Suggestions & Assistance](./need_suggestions_assistance.md) | AI-powered suggestions based on browsing context and intent | Planned |
| **Tier 4: Future** |
| 14 | [Discoverable Interface](./need_discoverable_interface.md) | Onboarding and in-app help for learning gestures and keys | Planned |

---

## Need Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VISION (docs/vision.md)                       │
│              Minimalism · Ergonomic Input · UI Evolution              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   Need 0a:           │  │   Need 0b:           │  │   (Immersive +       │
│   Immersive          │  │   Ergonomic Input    │  │   Ergonomic enable   │
│   Experience         │  │   Primacy             │  │   all other needs)   │
│                      │  │   (Scroll + Keyboard │  │                      │
│   - Fullscreen       │  │   modes)             │  │                      │
│   - Hidden chrome    │  │   - Space for nav     │  │                      │
│   - On-demand UI     │  │   - / for find       │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE: Navigation & Context                          │
│                                                                             │
│   Need 1: Tab Navigation ◄──► Need 2: Context ◄──► Need 3: Tab Actions       │
│                                    ▲                                        │
│                                    │                                        │
│                         Need 4: Window & Group Management                   │
│                         (Horizontal nav, dot indicators)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌──────────────────┐          ┌──────────────┐
│  Need 6:      │          │   Need 5:        │          │  Need 7:     │
│  Find in Page │          │   Quick          │          │  Workspace   │
│  (Search      │          │   Recovery       │          │  Management  │
│   within      │          │   (Undo close)   │          │  (Save/      │
│   current tab)│          │                  │          │   Suspend/   │
│               │          │                  │          │   Resume)    │
└───────────────┘          └──────────────────┘          └──────────────┘
           │                                                    │
        └────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 2: SUPPORTING (Browser Table Stakes)                  │
│                                                                             │
│   Need 5: Quick Recovery ◄──► Need 6: Duplicate Prevention                │
│   Need 7: Audio Management ◄──► Need 8: URL Manipulation                    │
│                                                                             │
│   (Essential browser hygiene: undo mistakes, prevent clutter,               │
│    control audio, manipulate URLs)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 3: ENHANCEMENT                                  │
│                                                                             │
│   Need 9: Workspace      Need 10: Find in Page                            │
│   Management              (Content search within tabs)                       │
│                                                                             │
│   Need 11: Information   Need 12: Task        Need 13: Suggestions           │
│   Summarization          Management           & Assistance                  │
│   (AI content triage)    (Focus, schedule)    (Context-aware AI)            │
│                                                                             │
│   [AI-powered tier: summarization, task focus, intelligent assistance]      │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌───────────────────────────────┐
                    │  TIER 4: FUTURE               │
                    │  Need 14: Discoverable        │
                    │  Interface (Onboarding, Help) │
                    └───────────────────────────────┘
```

---

## Implementation Priority

1. **Vision Foundation**: Needs 0a, 0b — Immersive experience and ergonomic input underpin all else
2. **Core UX**: Needs 1, 2, 3, 4 — Essential for daily browsing (navigation, context, actions, windows)
3. **Supporting (Table Stakes)**: Needs 5, 6, 7, 8 — Browser hygiene features (recovery, duplicates, audio, URLs)
4. **Enhancement - Organization**: Need 9 — Workspace management for context switching
5. **Enhancement - Discovery**: Need 10 — Find in page enhances content interaction
6. **Enhancement - AI-Powered**: Needs 11, 12, 13 — Information summarization, task management, intelligent assistance
7. **Future**: Need 14 — Discoverable interface (onboarding deferred)

---

## Detailed Documentation

### Tier 0: Vision-Aligned
- [need_immersive_experience.md](./need_immersive_experience.md)
- [need_ergonomic_input_primacy.md](./need_ergonomic_input_primacy.md)

### Tier 1: Core
- [need_efficient_tab_navigation.md](./need_efficient_tab_navigation.md)
- [need_tab_context_awareness.md](./need_tab_context_awareness.md)
- [need_tab_management.md](./need_tab_management.md)
- [need_window_management.md](./need_window_management.md)

### Tier 2: Supporting (Browser Table Stakes)
- [need_quick_recovery.md](./need_quick_recovery.md)
- [need_duplicate_prevention.md](./need_duplicate_prevention.md)
- [need_audio_management.md](./need_audio_management.md)
- [need_url_manipulation.md](./need_url_manipulation.md)

### Tier 3: Enhancement
- [need_workspace_management.md](./need_workspace_management.md)
- [need_find_in_page.md](./need_find_in_page.md)
- [need_information_summarization.md](./need_information_summarization.md)
- [need_task_management.md](./need_task_management.md)
- [need_suggestions_assistance.md](./need_suggestions_assistance.md)

### Tier 4: Future
- [need_discoverable_interface.md](./need_discoverable_interface.md)
