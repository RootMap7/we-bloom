# We Bloom

We Bloom is a responsive web app that analyzes exported WhatsApp
conversations and transforms chat data into meaningful, visual,
story-driven insights.

## Product philosophy

We Bloom should feel like:
- Spotify Wrapped meets WhatsApp analytics
- Warm, human, editorial, playful and intelligent
- A story about a conversation, powered by data

The product should NOT feel like:
- A generic SaaS dashboard
- Enterprise analytics software
- A spreadsheet
- A cold data visualization tool

## Design direction

Take visual inspiration from YNAB:
https://www.ynab.com/

Do not copy YNAB's branding or interface.

Prioritize:
- Warm visual language
- Strong typography
- Generous whitespace
- Rounded surfaces
- Editorial layouts
- Friendly micro-interactions
- Clear hierarchy
- Smooth motion

## Brand

Primary background: #FAF8F5
Primary accent: #E07A5F
Secondary accent: #F2CC8F
Dark: #2B2220

Typography:
- Headings: Fraunces
- Body: Outfit

## Motion

Motion is a core part of the experience.

Use subtle, polished animations for:
- Page transitions
- Scroll reveals
- Number counters
- Chart rendering
- Card entrances
- Hover states
- Upload progress
- Wrapped slides

Prefer smooth 200–600ms transitions.

Respect prefers-reduced-motion.

Do not add animation simply for decoration.

## Responsive

The application must be fully responsive.

Desktop:
- Sidebar navigation
- Multi-column layouts
- Large visualizations

Mobile:
- Bottom navigation
- Full-width cards
- Touch-friendly controls
- Swipeable Wrapped experience

Never allow accidental horizontal overflow.

## Architecture

Use:
- React
- TypeScript
- Tailwind CSS
- Motion / Framer Motion
- Recharts or equivalent

Build reusable components and keep the analytics engine,
WhatsApp parser, AI layer and UI modular.

Use mock data while developing the UI.

## Design system

Create reusable components rather than one-off UI.

Use design tokens for:
- Colors
- Typography
- Spacing
- Radius
- Shadows
- Motion

## Product rules

Statistics should be presented as a story, not a spreadsheet.

AI insights must distinguish observations from assumptions.

Never make unsupported psychological or relationship claims.

For example:

Good:
"Your conversations became more frequent in August."

Bad:
"They became more emotionally attached to you in August."

## Source of truth

Read PRODUCT.md before implementing or changing product functionality.

When implementing a feature, preserve the existing visual language
and component system rather than creating a separate design pattern.