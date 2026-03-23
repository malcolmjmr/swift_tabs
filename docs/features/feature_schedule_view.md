## Feature: Schedule View

**Feature ID:** 105  
**Status:** Planned  
**Priority:** Medium

---

### Overview

A dedicated tab-based view that displays scheduled items and tasks organized by time. Serves as the central hub for "read later" functionality and time-based task management. Accessible via keyboard shortcut similar to Tab Menu.

---

### Access

| Method | Action |
|--------|--------|
| Keyboard Shortcut | TBD key (similar to Tab Menu's "a" key) |
| Tab Menu | Navigate to Save → Schedule, or direct shortcut |

**Note:** This is part of the "System Menu" concept where settings and account details will also be stored.

---

### Data Model

**Schedule Item (Minimal for now):**
```
- id: unique identifier
- title: display name
- url: link reference
- scheduledTime: when to view (timestamp or relative like "tonight")
- parentTask: optional parent task for nesting
- tags: optional array of strings
- status: "pending" | "completed" | "archived"
```

**Task (for nesting):**
```
- id: unique identifier
- name: task name
- parentId: optional parent task for nesting
- tags: optional array of strings
- status: "active" | "completed" | "archived"
```

---

### View Layout

**Main Areas:**
1. **Header**: Title "Schedule", current date, view toggle (Day/Week/All)
2. **Time Sections**: Grouped by time buckets
   - Today / Tonight
   - Tomorrow
   - This Week
   - Later
3. **Item List**: Within each time section
4. **Footer**: Actions (Add Item, Settings)

**Item Display:**
- Title (clickable to open link)
- Scheduled time
- Parent task (if nested)
- Tags (if any)
- Actions: Complete, Reschedule, Open

---

### Adding Items to Schedule

**From Tab Menu (when saving a tab):**
- Path: Tab Menu → Save → Schedule
- Presets: "This Evening", "Tomorrow", "This Week", "Custom"
- Optional: Select parent task, add tags

**From Link Preview [101]:**
- "Schedule for Later" button in preview window
- Same time presets as Tab Menu

---

### Time Buckets

| Bucket | Time Range |
|--------|------------|
| Today | Current day, before 6 PM |
| Tonight | Today, 6 PM to midnight |
| Tomorrow | Next calendar day |
| This Week | Within 7 days |
| Later | Beyond 7 days |

---

### Interactions

| Action | Result |
|--------|--------|
| Click item title | Open link in new tab, mark as "viewed" |
| Complete action | Mark item as completed, optionally close tab if open |
| Reschedule | Move to different time bucket |
| Delete | Remove from schedule (with confirmation) |
| Expand task | Show/hide nested items |
| Filter by tag | Show only items with selected tag |
| Filter by parent | Show only items in selected task |

---

### Related Features

- Link Preview [101] - Can add to schedule from preview window
- Brief Generator [104] - Schedule items feed into briefs at appropriate times
- Tab Menu [6] - Entry point for "Save to Schedule"

---

### Future Considerations

**Not in initial implementation:**
- Recurring schedule items
- Notifications when scheduled time arrives
- Integration with external calendars
- Drag-and-drop rescheduling
- Calendar view (monthly/weekly grid)

**AI Enhancement (Future):**
- Auto-categorization of scheduled items by topic
- Smart time suggestions based on item length and user patterns
- Duplicate detection across scheduled items
