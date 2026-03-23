## Need: Audio Management

**Status:** Planned  
Priority: Medium

---

### Jobs to Be Done

When tabs are playing audio or sending notifications, I want to **see and control them at a glance** so that I can **mute, focus, or manage the right tab without hunting through my workspace**.

#### Key JTBD Statements:

1. **Main JTBD**: When multiple tabs might be playing audio, I want to see which ones are active and mute them quickly, so I can control my browsing soundscape.

2. **Secondary JTBD**: When I need to focus on one audio source, I want to mute all other tabs instantly, so I'm not interrupted by unexpected sounds.

3. **Tertiary JTBD**: When a tab starts playing audio unexpectedly, I want to find and control it immediately from the overview widget, so I can address it without context switching.

---

### Current Pain Points (Without Solution)

1. **Hidden Audio Sources**: Must hunt through tabs to find which is playing
2. **No Global Mute**: Chrome requires muting each tab individually
3. **Unexpected Audio**: Autoplay videos startle users; finding source is frustrating
4. **No Audio Context in Overview**: Can't see audio state at a glance in widget
5. **Notification Overload**: Sites requesting notification permission clutter the experience

---

### Desired Outcome

Complete audio awareness and control integrated into Swift Tabs:
- Audio indicator on tabs in overview widget (speaker icon with volume level)
- One-click mute from any tab view (active tab display, overview widget, omnibox)
- "Mute All Other Tabs" action in global context menu
- "Mute Tab" shortcut key ('m') in navigation mode
- Visual distinction for tabs with notification permissions

---

### Success Metrics

1. Audio indicators visible in overview widget and active tab display
2. Mute any tab: one click from any interface
3. Mute all others: one action from context menu or shortcut
4. Find audio source: under 2 seconds from overview widget
5. Audio state updates in real-time (no delay)

---

### Related Features

- Feature: Audio Indicator (planned)
- Feature: Quick Mute Action (planned)
- Feature: Mute All Others (planned)
- Feature: Notification Permission Indicator (planned)

---

### Notes

Audio management extends **Tab Context Awareness** to include audio state as part of the context. It's particularly valuable for users who keep many tabs open including media sites (YouTube, Spotify, news videos).

The feature should be **non-intrusive but visible**—audio indicators shouldn't dominate the UI but should be immediately apparent when needed.
