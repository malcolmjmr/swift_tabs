## Need: Quick Recovery

**Status:** Partially Implemented  
Priority: Medium

---

### Jobs to Be Done

When I accidentally close something important, I want to **recover it immediately** so that I can **continue working without disruption or data loss**.

#### Key JTBD Statements:

1. **Main JTBD**: When I accidentally close a tab (via gesture or other means), I want to undo that action instantly, so I don't lose the content I was viewing.

2. **Secondary JTBD**: When I close multiple tabs rapidly, I want to recover any of them within a short window, so I can clean up aggressively but safely.

---

### Current Pain Points (Without Solution)

1. **No Undo for Gestures**: Swipe-to-close has no confirmation, no recovery
2. **Browser History Friction**: Chrome's "Reopen closed tab" is buried in menus
3. **Lost Form Data**: Closed tabs lose form progress, scroll position
4. **Accidental Triggers**: Gesture interface makes accidental closures more likely

---

### Desired Outcome

Every tab closure within Swift Tabs provides a brief, non-intrusive undo option:
- Temporary undo button appears immediately after close
- Persists for ~5 seconds or until user takes another action
- One click restores tab exactly as it was (URL, history, ideally scroll position)
- No modal dialogs—inline, subtle UI

---

### Success Metrics

1. Undo available immediately after any close action
2. Undo persists for 5+ seconds
3. One click/tap to restore
4. Tab restored to original position in window
5. No interference with next action if user doesn't want to undo

---

### Related Features

- [Feature: Tab Close with Undo](../features/feature_tab_close_undo.md)

---

### Notes

This need is particularly important for Swift Tabs because the gesture interface makes accidental actions more likely than traditional point-and-click. The undo capability is a safety net that allows users to be aggressive with gestures without fear.

Currently implemented: Basic close via chrome API  
Planned: Undo button with timeout
