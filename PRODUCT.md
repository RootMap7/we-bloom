# We Bloom — Product Specification

## 1. Product Overview

**We Bloom** is a web application that analyzes exported WhatsApp conversations and transforms raw chat data into meaningful, visual, story-driven insights.

The product helps people understand the rhythm, patterns, habits, language, and memorable moments within their conversations.

### Core concept

> **Spotify Wrapped meets WhatsApp analytics meets relationship journaling.**

The experience should feel less like analyzing a dataset and more like discovering the story hidden inside a conversation.

### Core user journey

```text
Export WhatsApp Chat
        ↓
Upload Chat
        ↓
Parse Conversation
        ↓
Analyze Data
        ↓
Explore Insights
        ↓
Discover Patterns
        ↓
Reflect on the Conversation
        ↓
Share / Save / Revisit
```

---

# 2. Product Goals

We Bloom should help users:

1. Understand how a conversation evolved over time.
2. See who contributes most to the conversation.
3. Discover communication patterns and habits.
4. Identify memorable moments.
5. Explore commonly used words, phrases, and emojis.
6. Understand response-time patterns.
7. Discover periods of high and low activity.
8. See how communication changes over time.
9. Receive AI-generated observations based on measurable data.
10. Experience their conversation as a story rather than a spreadsheet.

---

# 3. Product Principles

## 3.1 Data should tell a story

Avoid presenting analytics as a wall of numbers.

Instead of:

> 18,492 messages

Prefer:

> **18,492 messages.**
> That's a lot of things to say to each other.

Numbers should have context.

---

## 3.2 Insights should be observational

The product can identify patterns, but should not pretend to know someone's internal emotional state.

Good:

> "Your conversations became noticeably more frequent in August."

Good:

> "You tend to have your longest conversations late at night."

Bad:

> "They became more emotionally attached to you in August."

Bad:

> "They were losing interest because they replied slower."

AI must clearly distinguish between:

* Observed data
* Statistical patterns
* Interpretation
* Speculation

The product should favor observation over speculation.

---

## 3.3 The experience should feel personal

The interface should feel warm, human and reflective.

Avoid language that sounds like enterprise analytics software.

Prefer:

> "You two really like talking after midnight."

Over:

> "Peak conversation activity occurs between 00:00–02:00."

Both may represent the same data, but the first communicates the product's personality.

---

## 3.4 Privacy is part of the product

Chat exports can contain extremely personal information.

The product must clearly communicate:

* What is processed
* Where processing occurs
* What is stored
* What is sent to AI services
* How long data is retained
* How users can delete their data

Do not make absolute privacy claims unless the implementation technically guarantees them.

---

# 4. Supported Input

## WhatsApp Export

The primary input is an exported WhatsApp chat file.

Initial supported format:

```text
.txt
```

The parser should support common WhatsApp export formats including:

```text
12/08/2026, 20:14 - Alex: Hey
12/08/2026, 20:15 - Jamie: Hey! How are you?
```

and variations in:

* Date format
* Time format
* 12/24-hour formats
* System messages
* Multiline messages
* Media placeholders
* Deleted messages
* Attachments
* Different locales

The parser should be modular so additional formats can be supported later.

---

# 5. Upload Experience

## Upload states

The upload experience should support:

1. Empty
2. Dragging
3. File selected
4. Uploading
5. Parsing
6. Analyzing
7. Complete
8. Error

### Upload messaging

Use human, playful progress messages.

Examples:

> Reading the rhythm…

> Finding the little patterns…

> Counting all those 😂…

> Looking for the moments that stand out…

> Following the conversation…

> Your conversation is blooming…

Avoid fake progress if the application cannot actually determine processing progress.

---

# 6. Analysis Engine

The analytics engine should transform the raw chat into structured data.

The UI must not calculate important analytics independently in multiple components.

Create a central analytics layer that produces normalized results.

Example conceptual structure:

```ts
{
  participants: [],
  messages: {},
  activity: {},
  responseTimes: {},
  words: {},
  emojis: {},
  media: {},
  conversations: {},
  streaks: {},
  milestones: {},
  trends: {}
}
```

Analytics should be reusable across:

* Dashboard
* Charts
* AI Insights
* Relationship DNA
* Chat Wrapped
* Ask Your Chat

---

# 7. Overview Dashboard

The Overview is the primary summary of the conversation.

## Hero

Start with a narrative summary.

Example:

> **You two have said a lot.**
>
> 18,492 messages across 247 days.

The hero should adapt to the available data.

---

## Core metrics

Display:

* Total messages
* Active days
* Average messages per day
* Average response time
* Longest conversation
* Longest talking streak
* Longest silence
* Most active day
* Most active hour

Metrics should be presented as visual cards rather than dense tables.

---

## Conversation snapshot

Show a visual summary of the relationship's communication patterns.

Possible metrics:

* Message balance
* Conversation initiation
* Average response time
* Word count
* Emoji usage
* Media usage

---

# 8. People

The People section compares participants.

For each participant calculate:

* Total messages
* Percentage of messages
* Total words
* Average words per message
* Conversations started
* Conversation initiation percentage
* Average response time
* Median response time
* Longest message
* Most active periods
* Emoji usage
* Media sent
* Unique words
* Most-used words
* Most-used emojis

## Comparison

The UI should make comparison intuitive.

Examples:

> Alex sent **58%** of the messages.

> Jamie starts **64%** of conversations.

> Alex tends to write longer messages.

Avoid competitive framing unless intentionally playful.

The goal is discovery, not declaring a winner.

---

# 9. Conversation Initiation

Analyze who starts conversations.

Calculate:

* Conversations initiated by each participant
* Percentage split
* Initiation by day
* Initiation by hour
* Initiation by weekday
* Common opening phrases
* Trends over time

Example insight:

> **Jamie starts most conversations.**
>
> 63% of identifiable conversation starts came from Jamie.

### Conversation definition

The system should define a conversation boundary using a configurable inactivity threshold.

Default:

```text
4 hours
```

This threshold should be configurable in the analytics layer.

---

# 10. Response Time

Analyze response behavior.

Calculate:

* Average response time
* Median response time
* Fastest response
* Longest response
* Response time by participant
* Response time by hour
* Response time by weekday
* Response time over time
* Response-time distribution

Avoid treating response time as a measure of interest, affection, honesty or commitment.

Example:

> "Your fastest conversations tend to happen between 8 PM and 11 PM."

Not:

> "They care more when they reply quickly."

---

# 11. Activity Over Time

Provide multiple time scales.

## Views

* Day
* Week
* Month
* Year

Where enough data exists.

Analyze:

* Message volume
* Active days
* Activity peaks
* Quiet periods
* Sudden spikes
* Long-term trends
* Weekday patterns
* Hourly patterns

Charts should emphasize meaningful patterns rather than maximizing information density.

---

# 12. Activity Heatmap

Provide a calendar/time heatmap showing when conversations are most active.

Dimensions may include:

```text
Day of week × Hour of day
```

Example:

> **You're a night-shift conversation.**
>
> Most messages happen between 9 PM and midnight.

The heatmap should work on mobile through:

* Horizontal scrolling
* Simplified labels
* Alternative compact visualization

---

# 13. Streaks

Identify continuous periods of communication.

Calculate:

* Longest conversation streak
* Current/recent streak
* Number of streaks
* Average streak length
* Most active streak
* Messages during longest streak

Example:

> **17 days.**
>
> That's your longest stretch of talking without a break.

Streak definitions must be based on the configured conversation/activity threshold.

---

# 14. Silence & Inactivity

Identify significant gaps.

Calculate:

* Longest silence
* Top inactivity gaps
* Average gap between active periods
* Silence by period
* Changes in gaps over time

Use neutral language.

Good:

> "Your longest pause was 11 days."

Avoid:

> "They ghosted you for 11 days."

Unless the user explicitly chooses playful language and the statement remains factually accurate.

---

# 15. Words

Analyze language patterns.

## Core analytics

Calculate:

* Most-used words
* Most-used phrases
* Word frequency
* Phrase frequency
* Unique words
* Average words per message
* Longest messages
* Shortest messages
* Words by participant
* Words over time
* Opening words
* Closing words

Exclude common stop words when generating meaningful rankings, while retaining them for raw statistical analysis.

Allow users to toggle:

* Common words
* Meaningful words
* Custom search

---

## Word Explorer

Users should be able to select a word.

Show:

* Total uses
* Who uses it most
* Usage percentage
* First appearance
* Most active period
* Usage over time
* Example context, where technically and privacy-wise appropriate

Example:

> **"love"**
>
> Used 184 times
> Mostly by Alex
> Most frequent in December

---

# 16. Emojis

Analyze emoji behavior.

Calculate:

* Most-used emojis
* Total emojis
* Emoji usage per participant
* Emoji frequency
* Emoji trends
* Distinctive emojis
* Emoji combinations
* Most common emoji sequences
* Emoji usage by time
* Emoji usage by participant

Examples:

> 😂 is basically part of the vocabulary.

> Alex uses ❤️ more than any other emoji.

Use playful presentation.

Emoji analytics should be visual and lightweight.

---

# 17. Media

Analyze media references in the exported chat.

Categories:

* Photos
* Videos
* GIFs
* Stickers
* Voice notes
* Documents
* Links
* Other attachments

Calculate:

* Total media
* Media per participant
* Media percentage
* Media by type
* Media over time
* Most active media periods

Example:

> **1,284 pieces of media exchanged.**

---

# 18. Voice Notes

Voice notes should be treated as a media category.

Calculate:

* Number of voice notes
* Voice notes by participant
* Percentage split
* Voice-note activity over time
* Average frequency

Do not claim to analyze the content, tone or emotion of voice notes unless actual audio files are provided and the product explicitly supports audio analysis.

---

# 19. Links & Shared Content

Where identifiable from the export, analyze:

* Number of links
* Links by participant
* Domains shared
* Most frequently shared domains
* Sharing trends
* Links by period

Potential future feature:

> "Your most shared corner of the internet."

---

# 20. Memorable Moments

Create a visual timeline of interesting moments discovered from the data.

Potential moments:

* First message
* First conversation
* Longest conversation
* Longest message
* Longest streak
* Longest silence
* Major activity spike
* First appearance of a frequently used word
* First appearance of a distinctive emoji
* Recurring topics
* Important dates
* Communication milestones

These moments should feel like a scrapbook rather than a statistical report.

---

# 21. Conversation Timeline

Create a chronological view showing major changes in the conversation.

Potential timeline events:

```text
First message
      ↓
First long conversation
      ↓
Activity spike
      ↓
Longest streak
      ↓
Quiet period
      ↓
Activity returns
```

Each event should contain:

* Date
* Metric
* Short explanation
* Optional supporting statistic

---

# 22. AI Insights

AI Insights interpret the analytics generated by the analysis engine.

AI should receive structured analytics rather than relying on raw chat content whenever possible.

## Insight categories

### Communication Style

Examples:

* Message length
* Response rhythm
* Conversation density
* Initiation patterns

### Conversation Rhythm

Examples:

* Typical active hours
* Weekday/weekend differences
* Long conversation periods
* Gaps

### Shared Language

Examples:

* Repeated words
* Inside-language patterns
* Shared emojis
* Distinctive phrases

### Changes Over Time

Examples:

* Increasing/decreasing activity
* Changing response times
* Shifts in initiation
* Changes in message length

### Interesting Patterns

Surface unusual or statistically notable findings.

---

# 23. AI Insight Rules

AI must follow these principles:

### Never present speculation as fact.

Use:

> "The data suggests…"

> "One noticeable pattern is…"

> "Your conversations appear to…"

Avoid:

> "This proves…"

> "They definitely felt…"

### Do not diagnose.

Never provide:

* Psychological diagnoses
* Attachment-style diagnoses
* Mental health diagnoses
* Personality disorders
* Definitive emotional conclusions

### Do not infer sensitive characteristics.

The system should not attempt to determine sensitive personal attributes from chat content.

### Do not fabricate evidence.

Every AI insight should be traceable to available analytics.

---

# 24. Ask Your Chat

Provide a conversational interface where users can ask questions about their analyzed conversation.

Example questions:

> Who talks more?

> Who usually starts conversations?

> When do we talk the most?

> What's our most-used word?

> What's my most-used emoji?

> Who replies faster?

> What was our longest conversation?

> When were we most active?

> What changed over time?

> What are some interesting patterns?

> What was our longest silence?

> Who sends more media?

The AI should answer from structured conversation data.

If the answer cannot be reliably determined:

> "I don't have enough data to answer that."

Never invent an answer.

---

# 25. Suggested Questions

The Ask Your Chat interface should provide suggested prompts.

Examples:

### About us

* Who talks more?
* Who starts conversations?
* What's our communication style?
* When do we talk most?

### The numbers

* What's our longest conversation?
* What's our longest streak?
* What's our longest silence?
* Who replies faster?

### The language

* What's our most-used word?
* Which emoji defines us?
* Who uses the most emojis?
* What words are unique to each of us?

### Discoveries

* What changed over time?
* What's the most interesting pattern?
* What surprised you about our conversation?

---

# 26. Relationship DNA

Relationship DNA is a playful summary of communication patterns.

It is **not scientific** and must not be presented as psychological assessment.

## Dimensions

Potential dimensions:

* Conversation rhythm
* Initiation balance
* Response style
* Message length
* Emoji personality
* Topic diversity
* Consistency
* Activity timing

Generate a playful profile.

Example:

> **The Late-Night Bloom**

> You two come alive when everyone else is asleep.

Include:

> For fun and reflection — not a psychological assessment.

---

# 27. Relationship DNA Scoring

Scores should be derived from measurable analytics.

Do not generate arbitrary scores purely from AI opinion.

Example:

```text
Conversation Rhythm     82
Initiation Balance      64
Consistency             71
Topic Diversity         78
Emoji Energy            91
```

The exact scoring model should live in the analytics layer and remain deterministic.

---

# 28. Chat Wrapped

Chat Wrapped is one of the most important experiences in the product.

It should transform the analysis into a story users want to explore and share.

Target:

```text
10–15 slides
```

Each slide should focus on one memorable insight.

Possible sequence:

### Slide 1

> **Your conversation, wrapped.**

### Slide 2

> **18,492 messages.**

### Slide 3

> **247 days of talking.**

### Slide 4

> **Your busiest hour?**
>
> 10 PM.

### Slide 5

> **Who starts the conversation?**
>
> Alex — 63%.

### Slide 6

> **Your signature emoji**
>
> 😂

### Slide 7

> **Your longest streak**
>
> 17 days.

### Slide 8

> **Your longest conversation**
>
> 6h 42m.

### Slide 9

> **Your most-used word**
>
> "love"

### Slide 10

> **Your conversation rhythm**
>
> Late-night bloomers.

### Slide 11

> **One thing the data noticed…**

### Final slide

> **Some conversations are just numbers.**
>
> This one became a story.

---

# 29. Wrapped Interaction

Wrapped should support:

* Previous/next navigation
* Swipe gestures on mobile
* Progress indicator
* Keyboard navigation
* Replay
* Share/export
* Reduced-motion mode

Transitions should feel smooth and cinematic without becoming distracting.

---

# 30. Sharing

Users should be able to share selected insights.

Potential share formats:

* Individual insight card
* Wrapped slide
* Relationship DNA
* Conversation summary

Future:

* Shareable image generation
* Social-friendly dimensions
* Downloadable report
* Public read-only story

Privacy must be considered before enabling public sharing.

---

# 31. Navigation

Primary application navigation:

```text
Overview
Activity
People
Words
Emojis
Media
Conversations
AI Insights
Chat Wrapped
```

Desktop:

* Persistent sidebar

Mobile:

* Bottom navigation
* Secondary items accessible through a More/menu interaction

Navigation should prioritize the most frequently used areas.

---

# 32. Responsive Requirements

The application must be fully responsive.

## Desktop

Use:

* Sidebar
* Multi-column layouts
* Large charts
* Expanded cards
* Spacious editorial composition

## Tablet

Use:

* Collapsible navigation
* Adaptive grids
* Reduced chart density

## Mobile

Use:

* Bottom navigation
* Full-width cards
* Stacked layouts
* Touch-friendly controls
* Horizontal chart scrolling where necessary
* Swipeable Wrapped experience
* Collapsible sections

Minimum interactive touch target:

```text
44 × 44px
```

Never allow accidental horizontal page overflow.

---

# 33. Data Visualization

Use visualizations when they make the data easier to understand.

Preferred:

* Area charts
* Line charts
* Bar charts
* Heatmaps
* Progress rings
* Radial visualizations
* Timelines
* Sparklines
* Large metric displays

Avoid:

* Dense dashboards
* Excessive gridlines
* Tiny labels
* Overloaded pie charts
* Charts that do not answer a clear question

Every visualization should answer:

> **What should the user notice here?**

---

# 34. Empty States

Empty states should feel human.

Avoid:

> No data available.

Prefer:

> **Nothing here yet.**
>
> Upload a conversation and we'll start finding the patterns.

Examples:

### Words

> Your vocabulary is waiting.

### Emojis

> We haven't counted the 😂 yet.

### AI Insights

> Once we have enough data, we'll start noticing things.

### Wrapped

> Your story is still loading.

---

# 35. Error States

Errors should explain what happened and what the user can do next.

Example:

> **We couldn't read that conversation.**
>
> Make sure you've uploaded a WhatsApp `.txt` export and try again.

Possible errors:

* Unsupported file
* Empty file
* Invalid format
* Corrupted export
* Parsing failure
* Insufficient data
* Analysis failure

Avoid technical error messages unless they are useful for debugging.

---

# 36. Insufficient Data

Some insights require enough conversation history.

The system should gracefully handle limited datasets.

Example:

> **Not enough data yet.**
>
> We need a little more conversation history before we can reliably calculate this.

Do not fabricate statistics.

---

# 37. Privacy Experience

Create a dedicated Privacy section.

Explain:

### Before upload

What information is contained in a WhatsApp export.

### During processing

How the application processes the file.

### Storage

Whether the chat is stored and for how long.

### AI processing

Clearly explain whether chat data or derived analytics are sent to an external AI service.

### Deletion

Provide a clear way to delete stored data if storage exists.

Privacy language must reflect the actual technical implementation.

---

# 38. Performance

The application should remain responsive when processing large exports.

Architecture should separate:

```text
UI
↓
Analytics Engine
↓
Parser
↓
AI Layer
```

Long-running analysis should not block the UI.

Use:

* Progressive loading
* Streaming/progressive results where appropriate
* Web Workers where useful
* Memoized calculations
* Lazy-loaded sections
* Virtualization for large lists

---

# 39. Mock Data

UI development should initially use realistic mock data.

Mock data should represent a believable conversation.

Example:

```text
Participants:
Alex
Jamie

Messages:
18,492

Active days:
247

Average messages/day:
74.8

Average response time:
8m 42s

Longest streak:
17 days

Longest silence:
11 days

Most active hour:
22:00

Conversation starter:
Alex — 63%
Jamie — 37%
```

Mock data should be rich enough to demonstrate every major screen.

---

# 40. Component Requirements

Build reusable components for:

* Button
* Card
* StatCard
* ChartCard
* Avatar
* Navigation
* Sidebar
* BottomNavigation
* Modal
* Tooltip
* ProgressBar
* ProgressRing
* Timeline
* InsightCard
* EmptyState
* UploadDropzone
* WrappedSlide
* Metric
* SegmentedControl
* WordCard
* EmojiCard
* MediaCard
* PersonComparison
* ActivityHeatmap

Avoid creating one-off components when an existing pattern can be reused.

---

# 41. Accessibility

The product must support:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible labels
* Screen-reader-friendly controls
* Sufficient color contrast
* Reduced motion
* Accessible chart descriptions
* Touch-friendly controls

Do not rely on color alone to communicate meaning.

---

# 42. Motion

Motion should reinforce the feeling of discovery.

Use animation for:

* Page transitions
* Number counters
* Chart rendering
* Card entrances
* Scroll reveals
* Upload progress
* Hover states
* Wrapped transitions
* Insight reveals

Motion should generally be subtle and polished.

Typical duration:

```text
200–600ms
```

Respect:

```text
prefers-reduced-motion
```

Do not animate everything.

---

# 43. Tone of Voice

We Bloom should sound:

* Warm
* Curious
* Intelligent
* Human
* Playful
* Reflective
* Slightly poetic

Avoid:

* Corporate language
* Excessive marketing language
* Clinical language
* Overly sentimental language
* Forced jokes

The writing should feel like a thoughtful friend showing you something interesting about your conversation.

---

# 44. Example Copy Style

### Instead of:

> Total message count

Use:

> **18,492 things said**

### Instead of:

> Average response time

Use:

> **You usually reply in 8 minutes.**

### Instead of:

> Activity distribution

Use:

> **You're most alive at night.**

### Instead of:

> Conversation initiation ratio

Use:

> **Who usually says hello first?**

### Instead of:

> Longest inactivity interval

Use:

> **Your longest quiet spell.**

---

# 45. Product Emotional Arc

The experience should follow an emotional progression:

```text
Curiosity
    ↓
Recognition
    ↓
Surprise
    ↓
Delight
    ↓
Reflection
```

The user should gradually move from:

> "Let's see what the numbers say."

to:

> "Wait… that's actually us."

The final experience should feel memorable, not merely informative.

---

# 46. Future Features

Potential future functionality:

* Multiple chat comparison
* Chat history over multiple exports
* Group chat analysis
* Topic clustering
* Conversation topic timeline
* Sentiment trends with strong privacy safeguards
* Audio analysis for voice notes
* Media gallery analysis
* Searchable conversation archive
* Shareable public stories
* PDF reports
* Account-based history
* Saved analyses
* Chat comparison
* Couple/friendship milestones
* Custom Wrapped themes

These should not be implemented unless explicitly requested.

---

# 47. Non-Goals

We Bloom is not:

* A WhatsApp replacement
* A messaging platform
* A psychological assessment tool
* A relationship diagnostic tool
* A surveillance tool
* A productivity analytics platform
* A generic business analytics dashboard

The product should help people **reflect on conversations**, not judge relationships.

---

# 48. Definition of Done

A feature is considered complete when:

* It works with realistic data.
* It works responsively.
* It uses the established design system.
* It handles empty states.
* It handles loading states.
* It handles errors.
* It supports accessibility requirements.
* It does not introduce horizontal overflow.
* Analytics are derived from the central analytics engine.
* AI-generated claims are grounded in available data.
* Motion respects reduced-motion preferences.
* The feature feels consistent with the rest of We Bloom.

---

# 49. Final Product Principle

We Bloom should never feel like:

> **A dashboard containing WhatsApp statistics.**

It should feel like:

> **A beautiful story about a conversation, powered by data.**

The product should leave users thinking:

> **"Whoa… this actually tells the story of us."**
