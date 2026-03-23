## Need: Information Summarization

**Status:** Planned  
**Priority:** Medium

---

### Jobs to Be Done

When I'm overwhelmed with information from multiple tabs, links, and search results, I want **AI-assisted summarization and content triage** so that I can **understand key insights without reading everything, prioritize what matters, and stay focused on my goals**.

#### Key JTBD Statements:

1. **Link Preview Summarization**: When I see a link (in search results, articles, or emails), I want a quick summary before opening, so I don't clutter my workspace with tabs I'll immediately close.

2. **Tab Content Summarization**: When I have a tab open, I want an instant abstract, table of contents, and key highlights, so I can grasp the content without scrolling through the entire page.

3. **Batch Link Summarization**: When I'm on a SERP or list of links, I want to select multiple links and get a comparative summary, so I can triage them efficiently and expand my query if needed.

4. **Briefs (Curated Digests)**: When I start or end my day, I want a curated digest of saved content, tasks, and key updates, so I can stay informed without opening every tab.

5. **Session Auto-Naming**: When I save a workspace or session, I want an auto-generated descriptive name based on tab content, so I can identify it later without opening every tab.

---

### Current Pain Points (Without Solution)

1. **Link Blindness**: Must open links to know if they're worth reading; creates tab clutter
2. **Tab Title Limits**: Tab titles truncated; insufficient to recall content
3. **SERP Overwhelm**: Search results require opening multiple tabs to compare
4. **No Quick Triage**: No way to batch-process a list of links for relevance
5. **Session Naming Friction**: Must manually name saved sessions
6. **Content Amnesia**: After hours of browsing, can't recall which tabs contained key insights without re-reading

---

### Desired Outcome

A comprehensive content understanding layer powered by AI:

#### 1. Link Preview Summarization
- Hover or quick-action preview for any link
- One-sentence summary with relevance indicator
- Source type detection (article, product, documentation, etc.)
- Option to "open" or "save to brief" without cluttering tabs

#### 2. Tab Content Summarization (Multi-Modal)
For any open tab, extract:
- **Abstract**: 1-2 sentence summary of the main thesis
- **Table of Contents**: Key sections with jump links
- **Highlights/Insights**: Key facts, quotes, data points, takeaways
- **Reading Time**: Estimated based on content length

#### 3. Batch Link Selection & Summarization (SERP/Lists)
- Select multiple links on a page (checkboxes or keyboard selection)
- Queue links for batch processing
- Get comparative summary: "These 5 articles cover X, Y, Z aspects"
- Query expansion suggestions: "You might also want to search for..."
- One-click add selected to brief or task

#### 4. Briefs (Curated Digests)
Time-based content curation:
- **Morning Brief**: Saved articles, task reminders, new emails/notifications
- **Evening Brief**: Unread content from the day, progress summaries
- **Weekly Brief**: Trends, completed tasks, upcoming priorities

Brief content sources:
- Tabs saved to tasks
- Bookmarked content flagged for brief
- External sources (configurable: newsletters, feeds)

---

### Success Metrics

1. **Link Preview**: Available within 2 actions; summary completes in under 3 seconds
2. **Tab Summary**: Abstract, ToC, and highlights available in one action; completes in under 5 seconds
3. **Batch Summarization**: Up to 10 links processed simultaneously; comparative summary in under 10 seconds
4. **Brief Generation**: Morning/evening brief auto-generated; user can customize in under 3 actions
5. **Session Naming**: Auto-generated name captures 3+ key topics from tab content
6. **Privacy Graceful**: Local processing where possible; clear indication when content sent to LLM

---

### Related Features

- Feature: Link Preview Overlay (hover summary)
- Feature: Tab Summary Panel (abstract, ToC, highlights)
- Feature: SERP Link Selector (batch selection, queue, compare)
- Feature: Brief Generator (morning/evening/weekly digests)
- Feature: Named Session Snapshots (auto-generated names)
- Service: llmService (content extraction and summarization)

**Note:** Focus Mode (tab filtering by relevance) is addressed in [Task Management](./need_task_management.md), which consumes summaries from this need to determine relevance.

---

### Integration Points

| Capability | Entry Point | Output |
|------------|-------------|--------|
| Link Preview | Hover or Meta+H on link | Floating card with summary |
| Tab Summary | Meta+S or Tab Menu > Summarize | Side panel with abstract, ToC, highlights |
| Batch Selection | Meta+Click links or "Q" for queue | Queue view with comparative summary |
| Briefs | Meta+B or scheduled notification | Full-page digest view |

---

### Notes

This need extends **Tab Context Awareness** and **Tab Management** by adding an AI-powered **understanding layer** that helps users process information without consuming it fully.

**Content Extraction Scope:**
- Phase 1: Titles, URLs, meta descriptions only (privacy-safe)
- Phase 2: Visible page content (requires content script)
- Phase 3: Full page content including iframes, PDFs (advanced)

**Privacy Considerations:**
- Clear opt-in for content extraction (not just title/URL)
- Local LLM option for sensitive content
- Per-site permission controls
- Transparent indicators when content sent to cloud LLM

**Briefs Evolution:**
- Start: Manual curation (user flags content for brief)
- Evolve: Auto-suggest based on saved content and activity
- Advanced: Integration with external sources (newsletters, RSS, notifications)
