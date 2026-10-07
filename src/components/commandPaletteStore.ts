import { createToggleStore } from '@/lib/createToggleStore'

/** Lets the Sidebar's "Search / Command" button and the mobile header's search icon open the same <CommandPalette> instance that Cmd/Ctrl+K toggles. */
export const commandPaletteStore = createToggleStore()
