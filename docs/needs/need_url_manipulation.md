## Need: URL Manipulation

**Status:** Planned  
Priority: Low-Medium

---

### Jobs to Be Done

When I need to modify, share, or navigate variants of a URL, I want to **edit, clean, or transform the URL quickly** so that I can **share cleaner links, fix typos, or navigate related pages without manual address bar editing**.

#### Key JTBD Statements:

1. **Main JTBD**: When I want to share a URL but it has tracking parameters, I want to copy a clean version quickly, so I can share without exposing unnecessary data.

2. **Secondary JTBD**: When I'm on a deep page and want to navigate up the hierarchy, I want to go to parent directory or domain quickly, so I don't have to manually edit the URL.

3. **Tertiary JTBD**: When I spot a typo in the URL or want to try a variation, I want to edit it inline without the full address bar selection dance, so I can navigate faster.

4. **Quaternary JTBD**: When a URL is too long to share comfortably, I want to generate a short link or see the canonical version, so I can share more cleanly.

---

### Current Pain Points (Without Solution)

1. **Tracking Parameters**: URLs full of utm_*, fbclid, etc. clutter shared links
2. **Manual URL Editing**: Must click address bar, select all, edit carefully
3. **No Quick Parent Navigation**: Can't easily navigate to parent directory or domain
4. **Long URLs**: Difficult to share long URLs in conversations or documents
5. **URL Typos**: Fixing typos requires full address bar interaction

---

### Desired Outcome

Power-user URL tools integrated into Swift Tabs interface:
- "Copy Clean URL" action: removes common tracking parameters
- "Go to Parent" action: navigate up URL hierarchy (/docs/features/ → /docs/)
- "Go to Root" action: navigate to domain root quickly
- Inline URL editor in active tab display (click title to edit URL)
- URL parameter toggle (show/hide query params)

---

### Success Metrics

1. Copy clean URL: one click, removes 90%+ of tracking params
2. Navigate to parent: one action, works on any path-based URL
3. Edit URL inline: click title, edit, press Enter
4. Zero accidental navigations (clear visual feedback before navigation)
5. Common tracking param database kept current

---

### Related Features

- Feature: Copy Clean URL (planned)
- Feature: Navigate to Parent/Root (planned)
- Feature: Inline URL Editor (planned)
- Feature: URL Parameter Toggle (planned)

---

### Notes

URL manipulation is a **power-user feature** that rounds out the "browser within a browser" concept. It provides advanced URL operations that complement the existing "Share (Copy URL)" action with more sophisticated options.

This need is lower priority than core navigation and management features, but adds significant value for users who frequently share links or navigate complex URL hierarchies.

The clean URL feature particularly appeals to privacy-conscious users who don't want to share tracking parameters with others.
