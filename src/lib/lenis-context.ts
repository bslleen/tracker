import type Lenis from 'lenis'
import { createContext, useContext } from 'react'

export const LenisContext = createContext<{ current: Lenis | null }>({ current: null })

export function useLenis() {
  return useContext(LenisContext).current
}
