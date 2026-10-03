import type { ComponentType, SVGProps } from 'react'
import {
  GoalsIcon,
  HomeIcon,
  MonthIcon,
  ReviewIcon,
  SettingsIcon,
  SleepIcon,
  SpendingIcon,
  StreakIcon,
} from '@/components/icons'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const HOME: NavItem = { label: 'Home', to: '/', icon: HomeIcon }
// There's no standalone /goals index route yet — the dashboard already is
// the goals overview, so "Goals" lands on the same page as "Home". Kept as
// its own labeled tab since the bottom bar spec calls for both by name.
const GOALS: NavItem = { label: 'Goals', to: '/', icon: GoalsIcon }
const STREAKS: NavItem = { label: 'Streaks', to: '/heatmap', icon: StreakIcon }
const REVIEW: NavItem = { label: 'Review', to: '/review', icon: ReviewIcon }
const MONTH: NavItem = { label: 'Month', to: '/month', icon: MonthIcon }
const SLEEP: NavItem = { label: 'Sleep', to: '/sleep', icon: SleepIcon }
const SPENDING: NavItem = { label: 'Spending', to: '/spending', icon: SpendingIcon }
const SETTINGS: NavItem = { label: 'Settings', to: '/settings', icon: SettingsIcon }

/** Bottom tab bar: 4 destinations + a "More" sheet for the rest (5 slots max). */
export const TAB_BAR_ITEMS: NavItem[] = [HOME, GOALS, STREAKS, REVIEW]
export const MORE_ITEMS: NavItem[] = [MONTH, SLEEP, SPENDING, SETTINGS]

/** Rail / sidebar: room for every distinct destination, no "More" grouping needed. */
export const FULL_NAV_ITEMS: NavItem[] = [HOME, STREAKS, MONTH, REVIEW, SLEEP, SPENDING, SETTINGS]
