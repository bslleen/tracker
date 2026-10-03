export type ChunkPreset = 5 | 10 | 15 | 30 | 60 | 'custom'

export const CHUNK_PRESETS: ChunkPreset[] = [5, 10, 15, 30, 60, 'custom']

export interface NewGoalState {
  step: 0 | 1 | 2
  direction: 1 | -1
  name: string
  hours: number
  playlistNote: string
  chunkPreset: ChunkPreset
  customChunkMinutes: string
  startNextMonth: boolean
}

export type NewGoalAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_HOURS'; hours: number }
  | { type: 'SET_PLAYLIST_NOTE'; note: string }
  | { type: 'SET_CHUNK_PRESET'; preset: ChunkPreset }
  | { type: 'SET_CUSTOM_CHUNK'; value: string }
  | { type: 'TOGGLE_START_NEXT_MONTH' }
  | { type: 'NEXT' }
  | { type: 'BACK' }

export const MIN_HOURS = 1
export const MAX_HOURS = 300

export function createInitialState(): NewGoalState {
  return {
    step: 0,
    direction: 1,
    name: '',
    hours: 10,
    playlistNote: '',
    chunkPreset: 15,
    customChunkMinutes: '',
    startNextMonth: false,
  }
}

/** Resolves the custom-vs-preset chunk size, or null while a custom value is invalid/empty. */
export function resolveChunkMinutes(state: NewGoalState): number | null {
  if (state.chunkPreset !== 'custom') return state.chunkPreset
  const parsed = Number.parseInt(state.customChunkMinutes, 10)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 120) return null
  return parsed
}

export function canLeaveStep(state: NewGoalState): boolean {
  if (state.step === 0) return state.name.trim().length > 0 && state.name.trim().length <= 60
  if (state.step === 1) return state.hours >= MIN_HOURS && state.hours <= MAX_HOURS
  return resolveChunkMinutes(state) !== null
}

export function newGoalReducer(state: NewGoalState, action: NewGoalAction): NewGoalState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.name.slice(0, 60) }
    case 'SET_HOURS':
      return { ...state, hours: Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(action.hours))) }
    case 'SET_PLAYLIST_NOTE':
      return { ...state, playlistNote: action.note }
    case 'SET_CHUNK_PRESET':
      return { ...state, chunkPreset: action.preset }
    case 'SET_CUSTOM_CHUNK':
      return { ...state, customChunkMinutes: action.value.replace(/[^\d]/g, '').slice(0, 3) }
    case 'TOGGLE_START_NEXT_MONTH':
      return { ...state, startNextMonth: !state.startNextMonth }
    case 'NEXT':
      if (!canLeaveStep(state) || state.step >= 2) return state
      return { ...state, step: (state.step + 1) as NewGoalState['step'], direction: 1 }
    case 'BACK':
      if (state.step <= 0) return state
      return { ...state, step: (state.step - 1) as NewGoalState['step'], direction: -1 }
    default:
      return state
  }
}
