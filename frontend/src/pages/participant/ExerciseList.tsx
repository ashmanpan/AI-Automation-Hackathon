import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, LoadingSpinner, Badge } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import teamService from '@/services/team.service'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ExerciseList = () => {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [hackathonId, setHackathonId] = useState<number | null>(null)

  useEffect(() => {
    loadTeamAndExercises()
  }, [])

  const loadTeamAndExercises = async () => {
    try {
      setLoading(true)
      const myTeam = await teamService.getMyTeam()
      setHackathonId(myTeam.hackathon_id)

      // Load exercises for this team's hackathon
      const data = await exerciseService.getAll({
        hackathon_id: myTeam.hackathon_id,
        is_active: true
      })
      setExercises(data)
    } catch (error) {
      toast.error('No team assigned. Please contact an administrator.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading exercises..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Available Exercises
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-base)' }}>
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Exercise Grid */}
      {exercises.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto var(--spacing-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              color: 'var(--color-text-tertiary)',
            }}>
              📋
            </div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-xl)' }}>No Active Exercises</h3>
            <p style={{ color: 'var(--color-text-tertiary)', maxWidth: '400px', margin: '0 auto' }}>
              There are no exercises available at this time. Check back later or contact your hackathon administrator for more information.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid-3">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              hover
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/participant/exercises/${exercise.id}`)}
            >
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h3 className="gradient-text" style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                  {exercise.title}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge variant="info">{exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}</Badge>
                  {exercise.time_limit_minutes && (
                    <Badge variant="secondary">{exercise.time_limit_minutes} min</Badge>
                  )}
                </div>
              </div>

              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-md)',
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {exercise.description ? exercise.description.replace(/<[^>]*>/g, '').substring(0, 150) : 'No description available'}
                {exercise.description && exercise.description.length > 150 ? '...' : ''}
              </p>

              <div className="divider" style={{ margin: 'var(--spacing-md) 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {exercise.submission_count || 0} submission{exercise.submission_count !== 1 ? 's' : ''}
                  </div>
                  {exercise.status && (
                    <Badge variant={exercise.status === 'active' ? 'success' : 'secondary'} style={{ fontSize: 'var(--font-size-xs)' }}>
                      {exercise.status.charAt(0).toUpperCase() + exercise.status.slice(1)}
                    </Badge>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
                    Max Score
                  </div>
                  <div className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', lineHeight: 1 }}>
                    {exercise.max_score}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExerciseList
