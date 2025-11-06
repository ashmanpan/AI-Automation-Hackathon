import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, StatsCard, Button, LoadingSpinner, Badge } from '@/components/common'
import leaderboardService from '@/services/leaderboard.service'
import exerciseService from '@/services/exercise.service'
import submissionService from '@/services/submission.service'
import teamService from '@/services/team.service'
import { ParticipantStats } from '@/types/leaderboard.types'
import { Exercise } from '@/types/exercise.types'
import { Submission } from '@/types/submission.types'
import { Team } from '@/types/team.types'
import toast from 'react-hot-toast'

const ParticipantDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ParticipantStats | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get team info first (includes hackathon_id)
      let myTeam
      try {
        myTeam = await teamService.getMyTeam()
        setTeam(myTeam)
      } catch (error) {
        console.log('No team assigned yet')
        toast.error('No team assigned. Please contact an administrator.')
        return
      }

      // Get participant stats (optional)
      try {
        const statsData = await leaderboardService.getParticipantStats()
        setStats(statsData)
      } catch (error) {
        console.log('Failed to load stats')
      }

      // Get active exercises using team's hackathon_id
      if (myTeam.hackathon_id) {
        try {
          const exercisesData = await exerciseService.getAll({
            hackathon_id: myTeam.hackathon_id,
            is_active: true
          })
          setExercises(exercisesData.slice(0, 6)) // Show first 6
        } catch (error) {
          console.log('Failed to load exercises')
        }
      }

      // Get team submissions (optional)
      try {
        const submissions = await submissionService.getTeamSubmissions(myTeam.id)
        setRecentSubmissions(submissions.slice(0, 5))
      } catch (error) {
        console.log('Failed to load submissions')
      }
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
          Participant Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          {team ? `Team: ${team.name}` : 'Welcome to the hackathon!'}
        </p>
      </div>

      {/* Team Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <StatsCard
          title="Team Rank"
          value={stats?.team_rank ? `#${stats.team_rank}` : '-'}
          variant="warning"
        />
        <StatsCard
          title="Total Score"
          value={stats?.total_score || 0}
          variant="success"
        />
        <StatsCard
          title="Completed"
          value={`${stats?.solved_exercises || 0}/${stats?.total_exercises || 0}`}
          variant="info"
        />
        <StatsCard
          title="Pending Review"
          value={stats?.pending_submissions || 0}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)', fontWeight: 600 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Button
            variant="primary"
            block
            onClick={() => navigate('/participant/exercises')}
          >
            Browse Exercises
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/participant/submissions')}
          >
            My Submissions
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => navigate('/leaderboard')}
          >
            View Leaderboard
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Available Exercises */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h2>Available Exercises</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/participant/exercises')}
            >
              View All →
            </Button>
          </div>

          {exercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--color-text-tertiary)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto var(--spacing-md)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-primary)' }}>No Exercises Available</h3>
              <p>Check back later for new challenges</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="hover-lift"
                  onClick={() => navigate(`/participant/exercises/${exercise.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{exercise.title}</h3>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                      <Badge variant="info">{exercise.type}</Badge>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                      {exercise.solve_count || 0} solves
                    </span>
                    <span className="gradient-text" style={{ fontWeight: 'bold' }}>
                      {exercise.max_score} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Submissions */}
        <Card>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Submissions</h2>

          {recentSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              <div style={{ fontSize: '36px', marginBottom: 'var(--spacing-sm)' }}>📭</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                No submissions yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  style={{
                    padding: 'var(--spacing-sm)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-xs)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                      {submission.exercise_title || `Exercise #${submission.exercise_id}`}
                    </span>
                    <Badge variant={submission.is_correct ? 'success' : 'error'} style={{ fontSize: 'var(--font-size-xs)' }}>
                      {submission.is_correct ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    <span>
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className={submission.points_awarded > 0 ? 'gradient-text' : ''}>
                      +{submission.points_awarded} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ParticipantDashboard
