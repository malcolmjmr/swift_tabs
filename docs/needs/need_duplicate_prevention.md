## Need: Duplicate Prevention

**Status:** Planned  
Priority: Medium

---

### Jobs to Be Done

When I'm opening new tabs, I want to **know if that page is already open** so that I can **avoid cluttering my workspace with duplicate tabs and stay organized**.

#### Key JTBD Statements:

1. **Main JTBD**: When I click a link or type a URL, I want the system to detect if that page is already open, so I can switch to it instead of creating a duplicate.

2. **Secondary JTBD**: When I have many tabs open and lose track, I want to quickly identify and merge duplicate tabs, so my workspace stays clean.

3. **Tertiary JTBD**: When I intentionally want multiple instances of the same page (e.g., different scroll positions), I want to override the duplicate detection, so I'm not blocked.

---

### Current Pain Points (Without Solution)

1. **Accidental Duplicates**: Open same page multiple times without realizing
2. **Wasted Screen Real Estate**: Multiple tabs of same content clutter tab bar
3. **Lost Context**: Different scroll positions or form states in duplicates create confusion
4. **Manual Cleanup**: Finding and closing duplicates is tedious
5. **No Smart Switch**: Chrome doesn't suggest "switch to existing tab" when opening URL

---

### Desired Outcome

Intelligent duplicate handling that keeps workspace clean:
- When opening a URL, automatically detect if already open
- Show subtle indicator: "Already open in Tab 12 - switch?"
- One-click switch to existing tab instead of opening new
- "Merge Duplicates" action to close all but one instance
- Option to allow intentional duplicates (per-domain or global setting)
- Smart matching (ignore URL fragments, query params optionally)

---

### Success Metrics

1. Duplicate detection occurs within 100ms of navigation
2. Switch to existing tab: one click or Enter key
3. Merge duplicates: available in overview widget or context menu
4. Zero false positives (never block intentional multiple instances)
5. URL matching configurable (exact, ignore fragment, ignore params)

---

### Related Features

- Feature: Duplicate Detection Indicator (planned)
- Feature: Smart Tab Switch (planned)
- Feature: Merge Duplicates Action (planned)
- Feature: URL Matching Configuration (planned)

---

### Notes

Duplicate prevention is a **workspace hygiene feature**. It keeps the browsing environment clean automatically, reducing the cognitive load of managing many tabs. This is especially valuable for users who open many links from emails, Slack, or other sources.

The implementation should be **unobtrusive**—detect duplicates but only suggest switching, never force it. Users should always have the option to open a new tab if desired.
