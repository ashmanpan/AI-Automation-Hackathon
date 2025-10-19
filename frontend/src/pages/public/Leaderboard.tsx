import { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner, Badge } from '@/components/common'
import leaderboardService from '@/services/leaderboard.service'
import { Leaderboard as LeaderboardType } from '@/types/leaderboard.types'
import toast from 'react-hot-toast'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadLeaderboard()

    // Auto-refresh every 30 seconds
    let interval: number | undefined
    if (autoRefresh) {
      interval = window.setInterval(() => {
        loadLeaderboard(true)
      }, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadLeaderboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await leaderboardService.getLeaderboard()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      if (!silent) toast.error('Failed to load leaderboard')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return '200px'
      case 2:
        return '160px'
      case 3:
        return '120px'
      default:
        return '100px'
    }
  }

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'linear-gradient(135deg, #FFD700, #FFA500)'
      case 2:
        return 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
      case 3:
        return 'linear-gradient(135deg, #CD7F32, #B87333)'
      default:
        return 'var(--color-bg-secondary)'
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading leaderboard..." />
  }

  const topThree = leaderboard?.entries.slice(0, 3) || []
  const restOfTeams = leaderboard?.entries.slice(3) || []

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Animated Background */}
      <div className="bg-animation"></div>

      {/* Header */}
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-sm)' }}>
            🏆 Leaderboard
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-lg)' }}>
            Live standings • {leaderboard?.total_teams || 0} team{leaderboard?.total_teams !== 1 ? 's' : ''} competing
          </p>
          {leaderboard?.last_updated && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-xs)' }}>
              Last updated: {new Date(leaderboard.last_updated).toLocaleTimeString()}
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
            <Button variant="primary" onClick={() => loadLeaderboard()}>
              🔄 Refresh Now
            </Button>
            <Button
              variant={autoRefresh ? 'success' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '✓ Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
          <Card style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-2xl)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-2xl)' }}>
              🎖️ Top Performers
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)',
              }}
            >
              {/* 2nd Place */}
              {topThree[1] && (
                <div
                  className="animate-fade-in-up"
                  style={{
                    textAlign: 'center',
                    flex: '0 0 250px',
                    animationDelay: '0.1s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '48px',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    🥈
                  </div>
                  <div
                    style={{
                      background: getPodiumColor(2),
                      height: getPodiumHeight(2),
                      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                      padding: 'var(--spacing-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: '0 10px 40px rgba(192, 192, 192, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    className="hover-lift"
                  >
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      #{topThree[1].rank}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      {topThree[1].team_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: '#fff' }}>
                      {topThree[1].total_score} pts
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 'var(--spacing-xs)' }}>
                      {topThree[1].solved_count} solved
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div
                  className="animate-fade-in-up"
                  style={{
                    textAlign: 'center',
                    flex: '0 0 280px',
                    animationDelay: '0s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '64px',
                      marginBottom: 'var(--spacing-sm)',
                      animation: 'pulse 2s infinite',
                    }}
                  >
                    👑
                  </div>
                  <div
                    style={{
                      background: getPodiumColor(1),
                      height: getPodiumHeight(1),
                      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                      padding: 'var(--spacing-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: '0 15px 50px rgba(255, 215, 0, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    className="hover-lift"
                  >
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      #{topThree[0].rank}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      {topThree[0].team_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: '#fff' }}>
                      {topThree[0].total_score} pts
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.9)', marginTop: 'var(--spacing-xs)' }}>
                      {topThree[0].solved_count} solved
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div
                  className="animate-fade-in-up"
                  style={{
                    textAlign: 'center',
                    flex: '0 0 250px',
                    animationDelay: '0.2s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '48px',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    🥉
                  </div>
                  <div
                    style={{
                      background: getPodiumColor(3),
                      height: getPodiumHeight(3),
                      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                      padding: 'var(--spacing-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: '0 10px 40px rgba(205, 127, 50, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    className="hover-lift"
                  >
                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      #{topThree[2].rank}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#fff', marginBottom: 'var(--spacing-xs)' }}>
                      {topThree[2].team_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: '#fff' }}>
                      {topThree[2].total_score} pts
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 'var(--spacing-xs)' }}>
                      {topThree[2].solved_count} solved
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Full Rankings Table */}
        {restOfTeams.length > 0 && (
          <Card>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Full Rankings</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Team Name</th>
                    <th style={{ textAlign: 'center' }}>Solved</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Last Submission</th>
                  </tr>
                </thead>
                <tbody>
                  {restOfTeams.map((entry) => (
                    <tr key={entry.team_id} className="animate-fade-in">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                            #{entry.rank}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: 'var(--font-size-lg)' }}>{entry.team_name}</strong>
                          {entry.members && entry.members.length > 0 && (
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                              {entry.members.slice(0, 3).join(', ')}
                              {entry.members.length > 3 && ` +${entry.members.length - 3} more`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant="success">{entry.solved_count} solved</Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="gradient-text" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                          {entry.total_score}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          points
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {entry.last_submission ? (
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            {new Date(entry.last_submission).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {(!leaderboard || leaderboard.entries.length === 0) && (
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
              <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-lg)' }}>🏆</div>
              <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>No Rankings Yet</h2>
              <p style={{ color: 'var(--color-text-tertiary)' }}>
                Teams will appear here once they start solving exercises
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
