import { create } from 'zustand'
import type { Match } from '@/types/match'

interface MatchState {
  matches: Match[]
  currentIndex: number
  loading: boolean
  matchSuccess: boolean

  setMatches: (matches: Match[]) => void
  setCurrentIndex: (i: number) => void
  nextMatch: () => void
  prevMatch: () => void
  setLoading: (v: boolean) => void
  setMatchSuccess: (v: boolean) => void
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  currentIndex: 0,
  loading: false,
  matchSuccess: false,

  setMatches: (matches) => set({ matches }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  nextMatch: () => set((s) => ({ currentIndex: Math.min(s.currentIndex + 1, s.matches.length - 1) })),
  prevMatch: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
  setLoading: (loading) => set({ loading }),
  setMatchSuccess: (matchSuccess) => set({ matchSuccess }),
}))
