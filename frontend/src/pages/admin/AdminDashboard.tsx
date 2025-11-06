import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, StatsCard, Button, LoadingSpinner } from '@/components/common'
import leaderboardService from '@/services/leaderboard.service'
import submissionService from '@/services/submission.service'
import { AdminStats } from '@/types/leaderboard.types'
import { Submission } from '@/types/submission.types'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, submissionsData] = await Promise.all([
        leaderboardService.getAdminStats(),
        submissionService.getAll(),
      ])

      setStats(statsData)
      setRecentSubmissions(submissionsData.slice(0, 10)) // Latest 10
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshLeaderboard = async () => {
    try {
      await leaderboardService.refreshLeaderboard()
      toast.success('Leaderboard refreshed successfully')
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to refresh leaderboard')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Manage hackathon platform and monitor activity
          </p>
        </div>
        <Button variant="primary" onClick={handleRefreshLeaderboard}>
          Refresh Leaderboard
        </Button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon="👥"
          trend={stats?.active_users ? { value: stats.active_users, label: 'active' } : undefined}
        />
        <StatsCard
          title="Total Teams"
          value={stats?.total_teams || 0}
          icon="🏆"
          variant="success"
        />
        <StatsCard
          title="Exercises"
          value={stats?.total_exercises || 0}
          icon="📝"
          variant="info"
        />
        <StatsCard
          title="Submissions"
          value={stats?.total_submissions || 0}
          icon="📊"
          trend={stats?.pending_grading ? { value: stats.pending_grading, label: 'pending', type: 'warning' } : undefined}
        />
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/admin/users/import')}
          >
            📥 Import Users
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/admin/teams/create')}
          >
            ➕ Create Team
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/admin/exercises/create')}
          >
            ✍️ Create Exercise
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/admin/leaderboard')}
          >
            🏅 View Leaderboard
          </Button>
        </div>
      </Card>

      {/* Top Team */}
      {stats?.top_team && (
        <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Leading Team</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '48px' }}>🥇</div>
            <div style={{ flex: 1 }}>
              <h3 className="gradient-text">{stats.top_team.name}</h3>
              <p style={{ color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-xs)' }}>
                Total Score: <strong className="gradient-text">{stats.top_team.score}</strong> points
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Submissions */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2>Recent Submissions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/submissions')}
          >
            View All →
          </Button>
        </div>

        {recentSubmissions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--spacing-xl)' }}>
            No submissions yet
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Status</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      {new Date(submission.submitted_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>{submission.team_name || 'Unknown'}</td>
                    <td>{submission.exercise_title || `Exercise #${submission.exercise_id}`}</td>
                    <td>
                      <span className={`badge ${submission.is_correct ? 'badge-success' : 'badge-error'}`}>
                        {submission.is_correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </td>
                    <td>
                      <strong className={submission.points_awarded > 0 ? 'gradient-text' : ''}>
                        {submission.points_awarded}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard
