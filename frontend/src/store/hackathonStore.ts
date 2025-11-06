import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Hackathon {
  id: number
  name: string
  description?: string
  status: string
  start_time?: string
  end_time?: string
}

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
