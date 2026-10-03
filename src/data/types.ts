import type { Timestamp } from 'firebase/firestore'

export type GoalStatus = 'active' | 'archived' | 'abandoned' | 'carried'

/** users/{uid} */
export interface UserDoc {
  displayName: string
  createdAt: Timestamp
  settings: {
    defaultChunkMinutes: number
    weekStartsOn: 0 | 1
  }
}

/** users/{uid}/goals/{goalId} */
export interface GoalData {
  name: string
  /** "2026-10" */
  month: string
  totalMinutes: number
  chunkMinutes: number
  completedChunks: number
  /** Minutes logged but not yet enough to complete another whole chunk. Always < chunkMinutes. */
  carryMinutes: number
  status: GoalStatus
  carriedFrom?: string
  /** 0-30 hue shift within the accent green family */
  hue: number
  /** Optional free-text note, e.g. "Andrew Ng ML — 48 videos". Never resolved against any API. */
  playlistNote?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Goal extends GoalData {
  id: string
}

/** users/{uid}/sessions/{sessionId} */
export interface SessionData {
  goalId: string
  /** "2026-10-03" */
  date: string
  minutes: number
  chunks: number
  /** The goal's carryMinutes immediately before this session, so undo can restore it exactly. */
  carryBefore: number
  at: Timestamp
}

export interface Session extends SessionData {
  id: string
}

export interface MonthDayEntry {
  total: number
  byGoal: Record<string, number>
}

export interface SleepEntry {
  hours: number
  quality: number
}

/** users/{uid}/months/{yyyy-mm} */
export interface MonthData {
  /** keyed by two-digit day, e.g. "03" */
  days: Record<string, MonthDayEntry>
  sleep?: Record<string, SleepEntry>
}

export interface Month extends MonthData {
  id: string
}

/** users/{uid}/spending/{id} */
export interface SpendingData {
  /** "2026-10-03" */
  date: string
  amount: number
  category: string
  note?: string
  createdAt: Timestamp
}

export interface SpendingEntry extends SpendingData {
  id: string
}
