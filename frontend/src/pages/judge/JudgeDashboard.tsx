import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, StatsCard, Button, LoadingSpinner, Badge } from '@/components/common'
import submissionService from '@/services/submission.service'
import leaderboardService from '@/services/leaderboard.service'
import { JudgeStats } from '@/types/leaderboard.types'
import { GradingQueue } from '@/types/submission.types'
import toast from 'react-hot-toast'

const JudgeDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<JudgeStats | null>(null)
  const [queue, setQueue] = useState<GradingQueue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, queueData] = await Promise.all([
        leaderboardService.getJudgeStats(),
        submissionService.getGradingQueue({ limit: 10 }),
      ])

      setStats(statsData)
      setQueue(queueData)
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Judge Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Review and grade submissions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <StatsCard
          title="Pending Submissions"
          value={stats?.pending_submissions || 0}
          icon="⏳"
          variant="warning"
        />
        <StatsCard
          title="Graded Today"
          value={stats?.graded_today || 0}
          icon="✅"
          variant="success"
        />
        <StatsCard
          title="Total Graded"
          value={stats?.total_graded || 0}
          icon="📊"
          variant="info"
        />
        <StatsCard
          title="Avg. Grading Time"
          value={`${stats?.avg_grading_time || 0}s`}
          icon="⏱️"
        />
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Button
            variant="primary"
            block
            onClick={() => navigate('/judge/queue')}
          >
            📝 View Grading Queue
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/judge/history')}
          >
            📜 Grading History
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/leaderboard')}
          >
            🏅 View Leaderboard
          </Button>
        </div>
      </Card>

      {/* Priority Queue */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2>Priority Queue</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/judge/queue')}
          >
            View All →
          </Button>
        </div>

        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🎉</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>All caught up!</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              No pending submissions to grade at the moment
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Participant</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Badge
                        variant={
                          item.priority === 'high'
                            ? 'error'
                            : item.priority === 'normal'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {item.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <strong>{item.team_name}</strong>
                    </td>
                    <td>{item.exercise_title}</td>
                    <td>{item.username}</td>
                    <td>
                      {new Date(item.submitted_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/judge/grade/${item.submission_id}`)}
                      >
                        Grade Now
                      </Button>
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

export default JudgeDashboard
