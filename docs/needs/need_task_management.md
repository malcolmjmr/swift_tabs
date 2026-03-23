## Need: Task Management

**Status:** Planned  
**Priority:** Medium

---

### Jobs to Be Done

When I'm researching, planning, or working on projects, I want to **organize tabs into tasks with deadlines, priorities, and schedules** so that I can **maintain focus, avoid tab overwhelm, and return to important content at the right time**.

#### Key JTBD Statements:

1. **Save to Task**: When I find a relevant tab, I want to quickly save it to a task (existing or new), so I can organize my work by objective rather than by tab.

2. **Task-Centric View**: When I'm working on a specific task, I want to see only the tabs associated with it, so I can stay focused without distraction from unrelated tabs.

3. **Schedule for Later**: When I find content I don't need right now, I want to schedule it for a specific time (evening, tomorrow, this week), so it reappears when I'm ready for it.

4. **Focus Mode**: When I need deep work, I want to activate a "focus mode" that shows only my current task's tabs, so I can avoid context switching and information overload.

5. **Task Lifecycle**: When I complete a task, I want to archive its tabs (close but save), so my workspace stays clean but I retain the reference material.

6. **Brief Integration**: When I start my day, I want my tasks and associated content presented in a brief, so I can prioritize my work session.

---

### Current Pain Points (Without Solution)

1. **Tab Overwhelm**: Open tabs represent "might need later" without clear organization
2. **No Task Context**: Tabs exist in isolation; no connection to the work they support
3. **Read-Later Friction**: "Save for later" becomes "never read" without scheduled reminders
4. **Context Switching**: All tabs visible all the time invites distraction
5. **Lost Research**: Closing a window loses the mental model of "this was my Research task"
6. **No Prioritization**: Can't distinguish urgent from background reading
7. **Completion Ambiguity**: Unclear when a set of tabs has served its purpose

---

### Desired Outcome

A lightweight task system integrated with browsing:

#### 1. Quick Save to Task
- One-gesture save from any tab (Meta+T or Tab Menu > Save > Task)
- Create new task inline or select existing
- Optional: Add note, set priority, schedule deadline
- Recent tasks appear in Quick Save for single-tap repeat

#### 2. Task List & Management
- Task inbox accessible from overview or dedicated key (Meta+Shift+T)
- Task properties: name, linked tabs, priority (high/medium/low), status (active/completed/archived)
- Optional deadline or scheduled time for brief inclusion
- Task progress indicator (tabs read / total tabs)

#### 3. Focus Mode
- Activate from task list or via Meta+F
- Hides all tabs not associated with current task
- "Focus view" replaces normal tab navigation while active
- Visual indicator of focus mode (task name, progress)
- Quick exit to full view (same gesture or Escape)
- Auto-suggest focus based on recent activity and active tab

#### 4. Schedule for Later
- When saving to task, option to "defer until" with presets:
  - This evening
  - Tomorrow morning
  - This week
  - This weekend
  - Specific date/time
- Scheduled tabs appear in Briefs at appropriate time
- Option to close tab now, reopen when scheduled

#### 5. Task Completion & Archive
- Mark task complete: closes all associated tabs
- Archive option: saves tab references without keeping open
- Restore task: reopen all tabs exactly as they were
- Completed tasks searchable for reference

#### 6. Brief Integration
- Active tasks automatically feed into Morning/Evening Briefs
- High-priority tasks highlighted
- Deadline warnings in brief ("due tomorrow")
- One-click from brief to focus mode for a task

---

### Success Metrics

1. **Save to Task**: Under 2 actions from any tab; task creation inline without dialog
2. **Focus Mode Activation**: Single gesture; task selection optional (uses recent/current)
3. **Focus Mode Exit**: Single gesture; returns to full view instantly
4. **Schedule**: Time-to-schedule under 3 seconds; presets available in 1 tap
5. **Task Completion**: Close/archive all tabs in under 2 actions
6. **Brief Integration**: Tasks appear in briefs automatically based on priority/schedule
7. **Task Discovery**: Find and switch to any task in under 3 actions

---

### Related Features

- Feature: Save to Task (Tab Menu integration)
- Feature: Task Inbox (task list view)
- Feature: Focus Mode (tab filtering by task association)
- Feature: Schedule for Later (time-based tab reopening)
- Feature: Brief Generator (task content in morning/evening digests)
- Feature: Named Session Snapshots (task as named workspace)

---

### Relationship to Other Needs

| Need | Relationship |
|------|--------------|
| Tab Management | Task Management extends save/move actions with task context |
| Workspace Management | Workspaces are containers; tasks are objectives that span workspaces |
| Information Summarization | Task content feeds into Briefs; focus mode leverages relevance filtering |
| Suggestions & Assistance | AI can suggest task creation based on browsing patterns |

### Key Distinctions

**Task vs Workspace:**
- **Workspace** = spatial container (tabs organized by location)
- **Task** = objective container (tabs organized by purpose/goal)
- One tab can be in a workspace AND associated with a task
- Workspaces persist as open windows; tasks can be active or archived

**Task vs Bookmark:**
- **Bookmark** = permanent reference (save forever)
- **Task** = temporary work unit (archive when done)
- Tasks have lifecycle: active → completed → archived
- Bookmarks persist; tasks are meant to be completed

---

### Notes

**Lightweight by Design:**
This is not a full project management system. Tasks are lightweight objectives with:
- A name
- Linked tabs
- Optional priority
- Optional schedule
- Status tracking

**Integration with Existing Features:**
- Save to Task appears in Tab Menu (already planned)
- Focus Mode extends Information Summarization's relevance filtering
- Brief integration extends Information Summarization's digest concept

**Future Evolution:**
- Dependencies between tasks
- Time tracking per task
- Recurring tasks
- External integrations (Todoist, Notion, Linear)
