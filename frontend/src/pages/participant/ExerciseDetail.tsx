import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, Alert, LoadingSpinner, Badge, Modal } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import submissionService from '@/services/submission.service'
import { Exercise, Hint } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ExerciseDetail = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [flag, setFlag] = useState('')
  const [showHintModal, setShowHintModal] = useState(false)
  const [selectedHint, setSelectedHint] = useState<Hint | null>(null)
  const [unlockedHints, setUnlockedHints] = useState<number[]>([])

  useEffect(() => {
    loadExercise()
  }, [exerciseId])

  const loadExercise = async () => {
    if (!exerciseId) {
      toast.error('Invalid exercise ID')
      navigate('/participant/exercises')
      return
    }

    try {
      setLoading(true)
      const data = await exerciseService.getById(parseInt(exerciseId))
      setExercise(data)
    } catch (error: any) {
      console.error('Failed to load exercise:', error)
      toast.error('Failed to load exercise')
      navigate('/participant/exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!flag.trim()) {
      toast.error('Please enter a flag')
      return
    }

    if (!exerciseId) return

    try {
      setSubmitting(true)
      const response = await submissionService.submitFlag({
        exercise_id: parseInt(exerciseId),
        flag: flag.trim(),
      })

      if (response.is_correct) {
        toast.success(`🎉 Correct! +${response.points_awarded} points`, { duration: 5000 })
        setFlag('')
        loadExercise() // Reload to update solve count
      } else {
        toast.error('❌ Incorrect flag. Try again!', { duration: 5000 })
      }
    } catch (error: any) {
      console.error('Failed to submit flag:', error)
      toast.error(error.response?.data?.message || 'Failed to submit flag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlockHint = (hint: Hint) => {
    setSelectedHint(hint)
    setShowHintModal(true)
  }

  const confirmUnlockHint = () => {
    if (selectedHint && !unlockedHints.includes(selectedHint.id)) {
      setUnlockedHints([...unlockedHints, selectedHint.id])
      toast.success(`Hint unlocked! -${selectedHint.penalty_points} points`)
    }
    setShowHintModal(false)
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
    return <LoadingSpinner fullScreen text="Loading exercise..." />
  }

  if (!exercise) {
    return (
      <Card>
        <Alert variant="error">Exercise not found</Alert>
      </Card>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/participant/exercises')} style={{ marginBottom: 'var(--spacing-md)' }}>
          ← Back to Exercises
        </Button>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          {exercise.title}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Badge variant="info">{exercise.category}</Badge>
          <Badge variant={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
          <Badge variant="secondary">{exercise.points} points</Badge>
          {exercise.time_limit && (
            <Badge variant="warning">⏱️ Time Limit: {exercise.time_limit} minutes</Badge>
          )}
          <Badge variant="secondary">
            {exercise.solve_count || 0} solve{exercise.solve_count !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Main Content */}
        <div>
          {/* Exercise Description */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Description</h2>
            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: exercise.description }}
            />
          </Card>

          {/* Attachments */}
          {exercise.attachments && exercise.attachments.length > 0 && (
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Attachments</h2>
              <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {exercise.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    download
                    style={{
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      textDecoration: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all var(--transition-fast)',
                    }}
                    className="hover-lift"
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        📎 {attachment.filename}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {(attachment.file_size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Submit Flag */}
          <Card>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Submit Flag</h2>
            <form onSubmit={handleSubmitFlag}>
              <Input
                placeholder="flag{your_flag_here}"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                disabled={submitting}
                help="Enter the flag you found to earn points"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={submitting}
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                {submitting ? 'Submitting...' : 'Submit Flag'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* Points */}
          <Card style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
                Points Value
              </div>
              <div className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                {exercise.points}
              </div>
              {unlockedHints.length > 0 && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-warning)' }}>
                  -{unlockedHints.reduce((sum, id) => {
                    const hint = exercise.hints?.find(h => h.id === id)
                    return sum + (hint?.penalty_points || 0)
                  }, 0)} penalty
                </div>
              )}
            </div>
          </Card>

          {/* Hints */}
          {exercise.hints && exercise.hints.length > 0 && (
            <Card>
              <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>
                💡 Hints ({exercise.hints.length})
              </h3>

              <Alert variant="warning" style={{ marginBottom: 'var(--spacing-md)' }}>
                Using hints will reduce your points for this exercise.
              </Alert>

              <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {exercise.hints
                  .sort((a, b) => a.order - b.order)
                  .map((hint, index) => (
                    <div
                      key={hint.id}
                      style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                          Hint #{index + 1}
                        </span>
                        <Badge variant="warning" style={{ fontSize: 'var(--font-size-xs)' }}>
                          -{hint.penalty_points} pts
                        </Badge>
                      </div>

                      {unlockedHints.includes(hint.id) ? (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                          {hint.hint_text}
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          block
                          onClick={() => handleUnlockHint(hint)}
                        >
                          🔓 Unlock Hint
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Unlock Hint Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Unlock Hint?"
        size="sm"
      >
        {selectedHint && (
          <>
            <Alert variant="warning" style={{ marginBottom: 'var(--spacing-md)' }}>
              This will deduct <strong>{selectedHint.penalty_points} points</strong> from your score for this exercise.
            </Alert>
            <p style={{ marginBottom: 'var(--spacing-xl)' }}>
              Are you sure you want to unlock this hint?
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <Button variant="ghost" onClick={() => setShowHintModal(false)} block>
                Cancel
              </Button>
              <Button variant="warning" onClick={confirmUnlockHint} block>
                Unlock Hint
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ExerciseDetail
