import { create } from 'zustand'
import type { UserRole } from '@/types/database'

interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string | null
  entidad_id: string | null
}

interface AuthStore {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}))
