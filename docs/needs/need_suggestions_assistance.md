## Need: Suggestions & Assistance

**Status:** Planned  
**Priority:** Medium

---

### Jobs to Be Done

When I'm browsing, researching, or working, I want **AI-powered suggestions based on my current context and intent** so that I can **discover relevant content, avoid repetitive actions, and work more efficiently without explicit commands**.

#### Key JTBD Statements:

1. **Contextual Suggestions**: When I'm on a page, I want the system to suggest relevant actions (save to task, summarize, related search), so I don't have to remember what's available.

2. **Next-Step Prediction**: When I complete an action, I want the system to predict my likely next step, so I can confirm with a single key instead of navigating menus.

3. **Query Expansion**: When I search for something, I want suggestions for related queries, refinements, and follow-up questions, so I can explore the topic thoroughly.

4. **Related Content Discovery**: When I'm reading about a topic, I want suggestions for related content from my existing tabs, bookmarks, and history, so I can leverage what I already know.

5. **Action Recommendations**: When I have many tabs open, I want the system to suggest actions (close duplicates, group similar, create task), so I can maintain workspace hygiene proactively.

6. **Brief Personalization**: When I receive my daily brief, I want it personalized based on my current tasks, recent activity, and priorities, so it's immediately actionable.

---

### Current Pain Points (Without Solution)

1. **Discoverability Gap**: Don't know what features are available in current context
2. **Repetitive Navigation**: Same sequences of actions for common workflows
3. **Query Myopia**: Stuck on initial search phrasing; missing better queries
4. **Rediscovery**: Forget that I already have relevant tabs/bookmarks on this topic
5. **Reactive Hygiene**: Only clean up workspace when it's already overwhelming
6. **Generic Briefs**: One-size-fits-all digests miss personal priorities
7. **Context Switching Cost**: Must consciously decide next action instead of flowing

---

### Desired Outcome

An intelligent assistance layer that anticipates needs and surfaces relevant actions:

#### 1. Contextual Action Suggestions
Based on current page, browsing history, and recent actions:
- **Research Mode Detected**: Suggest "Create task from these tabs" or "Summarize all"
- **Comparison Shopping**: Suggest "Compare these products" or "Save to task: Purchase Decision"
- **Documentation Browsing**: Suggest "Add to brief" or "Save as reference"
- **Duplicate Topic**: Suggest "Switch to existing tab on this topic"

Suggestion appearance:
- Subtle inline suggestions (not modal interruptions)
- Single-key confirmation (e.g., suggestion appears with "Y to confirm")
- Dismissible without penalty (suggestion fades if ignored)

#### 2. Next-Step Prediction
Learn from usage patterns to predict next actions:
- After closing 3 tabs on same topic → Suggest "Close remaining on this topic?"
- After saving 2 tabs to task → Suggest "Focus mode for this task?"
- After searching X then Y → Suggest "Query refinement Z based on pattern"

Confidence threshold: Only suggest when >70% confidence to avoid noise.

#### 3. Query Expansion & Refinement
For any search context (SERP, omnibox, find-in-page):
- Suggest related queries based on content analysis
- Propose follow-up questions that deepen understanding
- Recommend broader/narrower query variants
- Surface "people also ask" style expansions from current page content

#### 4. Related Content Discovery
Cross-reference current page against:
- Open tabs with similar content (embedding similarity)
- Bookmarked pages on related topics
- Recently closed tabs on same domain/topic
- History of related searches

Present as: "You have 3 related tabs on this topic" with quick-switch option.

#### 5. Proactive Workspace Hygiene
Detect patterns that suggest action:
- 5+ tabs on same domain → Suggest "Create group/workspace?"
- 3+ duplicate URLs (different fragments) → Suggest "Merge duplicates?"
- 10+ tabs open for 24h without visit → Suggest "Sleep old tabs?"
- Similar tab titles → Suggest "Group into task?"

Weekly hygiene digest in brief: "You have 12 tabs you haven't visited in a week. Archive them?"

#### 6. Personalized Briefs
AI-curated briefs based on:
- Current active tasks and their priority
- Recently saved content flagged for brief
- Deadline proximity (tasks due soon highlighted)
- Browsing patterns ("You often check X in the morning")
- Information gaps ("You have 5 unread tabs from yesterday")

---

### Success Metrics

1. **Suggestion Relevance**: >70% of suggestions accepted or acknowledged as useful
2. **Suggestion Timing**: Suggestions appear within 1 second of context detection
3. **Query Expansion**: Users adopt suggested query refinements >30% of the time
4. **Related Content Discovery**: Users switch to suggested related tabs >25% of the time
5. **Proactive Hygiene**: Users act on hygiene suggestions >40% of the time
6. **Brief Engagement**: Users open >80% of personalized briefs (vs <50% for generic)
7. **Non-Intrusiveness**: <5% of suggestions dismissed as annoying or irrelevant

---

### Related Features

- Feature: Contextual Suggestion Bar (inline action suggestions)
- Feature: Next-Step Prediction Engine (pattern-based recommendations)
- Feature: Query Expansion Assistant (search refinement)
- Feature: Related Content Overlay (similar tab discovery)
- Feature: Hygiene Assistant (proactive workspace maintenance)
- Feature: Personalized Brief Generator (AI-curated digests)
- Service: llmService (embedding generation, similarity search)
- Service: patternLearningService (usage pattern analysis)

---

### Suggestion UI Patterns

| Context | Suggestion Style | Confirmation |
|---------|----------------|--------------|
| Active Tab Info | Inline text below tab info | "Y" key to confirm |
| Navigation Mode | Floating pill overlay | Enter to confirm, Esc to dismiss |
| Omnibox | Dropdown suggestion | Tab to accept, Enter to execute |
| Brief | Section with quick actions | Click or number key |
| Overview | Badge on container | Click badge to see suggestion |

---

### Privacy & Learning

**Local-First Pattern Learning:**
- Usage patterns learned locally (not sent to server)
- Pattern model: action sequences → next action probabilities
- User can reset learned patterns anytime

**Content Analysis Scope:**
- Title and URL only for initial suggestions (privacy-safe)
- Optional opt-in for full content analysis (better suggestions)
- Per-site permission for content extraction
- Clear indication when LLM processing occurs

**User Control:**
- Suggestion frequency: High/Medium/Low/Off
- Category toggles: Actions, Queries, Hygiene, Discovery
- Feedback mechanism: "This was helpful / not helpful" trains local model

---

### Notes

**Non-Intrusive by Design:**
Suggestions should feel like "helpful awareness" not "pushy interruptions":
- Fade in gently, not pop up aggressively
- Disappear if user takes other action
- Never block primary interface
- Never require dismissal to continue

**Progressive Intelligence:**
- Phase 1: Rule-based suggestions (domain patterns, time-based)
- Phase 2: Local pattern learning (action sequences)
- Phase 3: Embedding-based similarity (content relationships)
- Phase 4: LLM-powered reasoning (complex intent detection)

**Relationship to Other AI Features:**
- Information Summarization: "What's this about?"
- Suggestions & Assistance: "What should I do next?"
- Task Management: "What am I working on?"
- Briefs: "What do I need to know today?"

Together these form an AI-powered layer that helps users process information efficiently, maintain focus, and discover relevant content without manual effort.
