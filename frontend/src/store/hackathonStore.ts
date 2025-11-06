import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Hackathon } from '@/types/hackathon.types'

interface HackathonStore {
  selectedHackathon: Hackathon | null
  setSelectedHackathon: (hackathon: Hackathon | null) => void
  clearSelectedHackathon: () => void
}

export const useHackathonStore = create<HackathonStore>()(
  persist(
    (set) => ({
      selectedHackathon: null,
      setSelectedHackathon: (hackathon) => set({ selectedHackathon: hackathon }),
      clearSelectedHackathon: () => set({ selectedHackathon: null }),
    }),
    {
      name: 'hackathon-storage',
    }
  )
)
