import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Select, LoadingSpinner, Badge } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ExerciseList = () => {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  useEffect(() => {
    loadExercises()
  }, [filterDifficulty, filterCategory])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const params: any = { is_active: true }
      if (filterDifficulty) params.difficulty = filterDifficulty
      if (filterCategory) params.category = filterCategory

      const data = await exerciseService.getAll(params)
      setExercises(data)
    } catch (error) {
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'error'
      default:
        return 'secondary'
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
          Browse Exercises
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Select
            label="Filter by Difficulty"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>

          <Select
            label="Filter by Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="web">Web</option>
            <option value="crypto">Crypto</option>
            <option value="forensics">Forensics</option>
            <option value="reversing">Reversing</option>
            <option value="pwn">Pwn</option>
            <option value="misc">Misc</option>
          </Select>
        </div>
      </Card>

      {/* Exercise Grid */}
      {exercises.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📝</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No exercises found</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {filterDifficulty || filterCategory ? 'Try adjusting your filters' : 'Check back later for new challenges'}
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
                <h3 className="gradient-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
                  {exercise.title}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                  <Badge variant="info">{exercise.category}</Badge>
                  <Badge variant={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
                  </Badge>
                  {exercise.time_limit && (
                    <Badge variant="secondary">⏱️ {exercise.time_limit}m</Badge>
                  )}
                </div>
              </div>

              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-md)',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {exercise.description.replace(/<[^>]*>/g, '').substring(0, 150)}
                {exercise.description.length > 150 ? '...' : ''}
              </p>

              <div className="divider" style={{ margin: 'var(--spacing-md) 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {exercise.solve_count || 0} solve{exercise.solve_count !== 1 ? 's' : ''}
                  </div>
                  {exercise.hints && exercise.hints.length > 0 && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      💡 {exercise.hints.length} hint{exercise.hints.length !== 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="gradient-text" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                    {exercise.points}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    points
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
