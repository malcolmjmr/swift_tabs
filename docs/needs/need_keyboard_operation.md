## Need: Keyboard-Only Operation

**Status:** Planned  
Priority: High

---

### Jobs to Be Done

When I'm typing or want to keep my hands on the keyboard, I want to **control all tab and window operations via keyboard shortcuts** so that I can **stay in flow without reaching for the mouse or breaking my typing rhythm**.

#### Key JTBD Statements:

1. **Main JTBD**: When my hands are on the keyboard, I want to switch tabs, close tabs, and open the overview widget using shortcuts, so I don't have to reach for the mouse.

2. **Secondary JTBD**: When I prefer keyboard-driven workflows (like Vim users), I want modal navigation similar to Vim's style, so I can navigate efficiently without mouse dependency.

3. **Tertiary JTBD**: When learning the extension, I want to see available shortcuts contextually, so I can discover features without memorizing documentation.

---

### Current Pain Points (Without Solution)

1. **Gesture Requires Mouse**: Current right-click + scroll gesture requires mouse interaction
2. **No Keyboard Equivalent**: Users who prefer keyboard have no path to use Swift Tabs features
3. **Shortcut Conflicts**: Chrome has many shortcuts; finding available combinations is difficult
4. **No Visual Shortcut Help**: Users must leave the app to learn shortcuts
5. **Accessibility Gap**: Keyboard-only users cannot use the extension

---

### Desired Outcome

Every gesture-based feature has a keyboard equivalent:
- Trigger overview widget: configurable shortcut (default: Alt+Shift+S for "Swift")
- Navigate tabs: Arrow keys or Vim keys (j/k) in navigation mode
- Close tab: Delete or 'd' key in navigation mode
- Open omnibox: configurable shortcut (default: Alt+Shift+O)
- Modal interface similar to Vim (press trigger, then single keys for actions)

Keyboard shortcut reference visible on demand (press '?' in any mode).

---

### Success Metrics

1. 100% feature parity between gesture and keyboard interfaces
2. All core actions achievable in 2 keystrokes or fewer
3. No mouse required for any tab management task
4. Shortcuts customizable to avoid conflicts
5. Visual shortcut help available in under 1 second

---

### Related Features

- Feature: Configurable Keyboard Shortcuts (planned)
- Feature: Vim-Style Navigation Mode (planned)
- Feature: Shortcut Help Overlay (planned)
- Feature: Conflict Detection (planned)

---

### Notes

Keyboard operation is **essential for true ergonomics**. Many power users prefer keyboard-driven workflows, and accessibility requirements demand keyboard support. This need complements rather than replaces the gesture interface—users choose their preferred input method.

The modal approach (trigger key, then action key) allows many actions with minimal shortcut keys, similar to Vim or Vimium.
