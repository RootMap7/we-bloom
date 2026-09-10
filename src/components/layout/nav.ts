/**
 * Navigation model — PRODUCT.md §31. Desktop shows all of it in a sidebar;
 * mobile shows the first four in a bottom bar and the rest behind "More".
 */
export interface NavItem {
  to: string
  label: string
  icon: string
  /** Short label for the mobile bar, where space is tight. */
  short?: string
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/report', label: 'Overview', icon: '◉' },
  { to: '/report/activity', label: 'Activity', icon: '◴' },
  { to: '/report/people', label: 'People', icon: '◐' },
  { to: '/report/wrapped', label: 'Chat Wrapped', icon: '✦', short: 'Wrapped' },
]

export const SECONDARY_NAV: NavItem[] = [
  { to: '/report/words', label: 'Words', icon: '❝' },
  { to: '/report/emojis', label: 'Emojis', icon: '☺' },
  { to: '/report/media', label: 'Media', icon: '▣' },
  { to: '/report/conversations', label: 'Conversations', icon: '⇄' },
  { to: '/report/insights', label: 'AI Insights', icon: '✧', short: 'Insights' },
]

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV]

export const UTILITY_NAV: NavItem[] = [
  { to: '/report/ask', label: 'Ask your chat', icon: '?' },
  { to: '/privacy', label: 'Privacy', icon: '⚿' },
]
