import { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Badge } from '@/components/common'
import { useHackathonStore } from '@/store/hackathonStore'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface LeaderboardEntry {
  rank: number
  team_id: number
  team_name: string
  total_score: number
  solved_exercises: number
  total_exercises: number
  last_submission: string | null
}

const AdminLeaderboard = () => {
  const { selectedHackathon } = useHackathonStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedHackathon) {
      loadLeaderboard()
    }
  }, [selectedHackathon])

  const loadLeaderboard = async () => {
    if (!selectedHackathon) return

    try {
      setLoading(true)
      const response = await api.get<{ leaderboard: LeaderboardEntry[] }>(
        `/api/leaderboard/${selectedHackathon.id}`
      )
      setLeaderboard(response.data.leaderboard)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'success'
    if (rank === 2) return 'info'
    if (rank === 3) return 'warning'
    return 'secondary'
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (!selectedHackathon) {
    return (
      <div>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)' }}>
          Leaderboard
        </h1>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>🏅</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Hackathon Selected</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              Please select a hackathon from the dropdown above
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading leaderboard..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Leaderboard
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          {selectedHackathon.name} - {leaderboard.length} team{leaderboard.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>🏅</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Teams Yet</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              Teams will appear here once they start submitting and getting graded
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Team Name</th>
                  <th>Total Score</th>
                  <th>Progress</th>
                  <th>Last Submission</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.team_id}>
                    <td>
                      <Badge variant={getRankBadgeVariant(entry.rank)}>
                        {getRankEmoji(entry.rank)}
                      </Badge>
                    </td>
                    <td>
                      <strong>{entry.team_name}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-accent-mint)' }}>
                        {entry.total_score.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {entry.solved_exercises} / {entry.total_exercises}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                            maxWidth: '120px'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(entry.solved_exercises / entry.total_exercises) * 100}%`,
                              background: 'var(--color-accent-gradient)',
                              transition: 'width var(--transition-base)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {entry.last_submission ? (
                        new Date(entry.last_submission).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>No submissions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AdminLeaderboard
