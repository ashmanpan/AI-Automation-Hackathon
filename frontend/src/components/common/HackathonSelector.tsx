import { useState, useEffect } from 'react'
import { useHackathonStore } from '@/store/hackathonStore'
import hackathonService from '@/services/hackathon.service'
import { Select } from './Select'

export const HackathonSelector = () => {
  const { selectedHackathon, setSelectedHackathon } = useHackathonStore()
  const [hackathons, setHackathons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHackathons()
  }, [])

  const loadHackathons = async () => {
    try {
      setLoading(true)
      const data = await hackathonService.getAll()
      setHackathons(data)

      // If no hackathon selected, auto-select the active one or the first one
      if (!selectedHackathon && data.length > 0) {
        const active = data.find((h: any) => h.status === 'active') || data[0]
        setSelectedHackathon(active)
      }
    } catch (error) {
      console.error('Failed to load hackathons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hackathon = hackathons.find(h => h.id === parseInt(e.target.value))
    if (hackathon) {
      setSelectedHackathon(hackathon)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
        Loading hackathons...
      </div>
    )
  }

  if (hackathons.length === 0) {
    return (
      <div style={{ padding: 'var(--spacing-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
        No hackathons found
      </div>
    )
  }

  return (
    <div style={{ minWidth: '250px' }}>
      <select
        value={selectedHackathon?.id || ''}
        onChange={handleChange}
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {hackathons.map((hackathon) => (
          <option key={hackathon.id} value={hackathon.id}>
            🎯 {hackathon.name} {hackathon.status === 'active' ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
