import { create } from 'zustand'
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth, googleProvider } from '@/config/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  init: () => () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async () => {
    await signInWithPopup(auth, googleProvider)
  },

  logout: async () => {
    await signOut(auth)
    set({ user: null })
  },

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false })
    })
    return unsubscribe
  },
}))
