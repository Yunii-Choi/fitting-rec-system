import { create } from 'zustand'
import type { Gender } from '@/types/user'
import type { StyleProfile } from '@/types/style'

interface ProfileState {
  // Form data
  nickname: string
  gender: Gender
  age: string
  // Uploaded images
  outfitImages: {
    daily: File | null
    date: File | null
    mystyle: File | null
  }
  // Analysis result
  styleProfile: StyleProfile | null
  analyzing: boolean

  // Actions
  setNickname: (v: string) => void
  setGender: (v: Gender) => void
  setAge: (v: string) => void
  setOutfitImage: (category: 'daily' | 'date' | 'mystyle', file: File | null) => void
  setStyleProfile: (profile: StyleProfile) => void
  setAnalyzing: (v: boolean) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  nickname: '',
  gender: 'M',
  age: '',
  outfitImages: { daily: null, date: null, mystyle: null },
  styleProfile: null,
  analyzing: false,

  setNickname: (nickname) => set({ nickname }),
  setGender: (gender) => set({ gender }),
  setAge: (age) => set({ age }),
  setOutfitImage: (category, file) =>
    set((state) => ({
      outfitImages: { ...state.outfitImages, [category]: file },
    })),
  setStyleProfile: (styleProfile) => set({ styleProfile }),
  setAnalyzing: (analyzing) => set({ analyzing }),
  reset: () =>
    set({
      nickname: '',
      gender: 'M',
      age: '',
      outfitImages: { daily: null, date: null, mystyle: null },
      styleProfile: null,
      analyzing: false,
    }),
}))
