import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, Textarea, Alert, LoadingSpinner, Badge } from '@/components/common'
import submissionService from '@/services/submission.service'
import exerciseService from '@/services/exercise.service'
import { Submission } from '@/types/submission.types'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const GradeSubmission = () => {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)

  const [gradingData, setGradingData] = useState({
    is_correct: false,
    points_awarded: 0,
    feedback: '',
  })

  useEffect(() => {
    loadSubmission()
  }, [submissionId])

  const loadSubmission = async () => {
    if (!submissionId) {
      toast.error('Invalid submission ID')
      navigate('/judge/queue')
      return
    }

    try {
      setLoading(true)
      const submissionData = await submissionService.getById(parseInt(submissionId))
      setSubmission(submissionData)

      // Load exercise details
      const exerciseData = await exerciseService.getById(submissionData.exercise_id)
      setExercise(exerciseData)

      // Pre-fill grading data
      setGradingData({
        is_correct: false,
        points_awarded: 0,
        feedback: '',
      })
    } catch (error: any) {
      console.error('Failed to load submission:', error)
      toast.error('Failed to load submission')
      navigate('/judge/queue')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (exercise) {
      setGradingData({
        is_correct: true,
        points_awarded: exercise.points || exercise.max_score,
        feedback: 'Correct submission!',
      })
    }
  }

  const handleReject = () => {
    setGradingData({
      is_correct: false,
      points_awarded: 0,
      feedback: 'Incorrect flag submitted.',
    })
  }

  const handleSubmitGrade = async () => {
    if (!submissionId) return

    if (!gradingData.feedback.trim()) {
      toast.error('Please provide feedback')
      return
    }

    try {
      setGrading(true)
      await submissionService.gradeSubmission({
        submission_id: parseInt(submissionId),
        is_correct: gradingData.is_correct,
        points_awarded: gradingData.points_awarded,
        feedback: gradingData.feedback,
      })

      toast.success('Submission graded successfully!')
      navigate('/judge/queue')
    } catch (error: any) {
      console.error('Failed to grade submission:', error)
      toast.error(error.response?.data?.error || 'Failed to grade submission')
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading submission..." />
  }

  if (!submission || !exercise) {
    return (
      <Card>
        <Alert variant="error">Submission not found</Alert>
      </Card>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/judge/queue')} style={{ marginBottom: 'var(--spacing-md)' }}>
          ← Back to Queue
        </Button>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Grade Submission
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Review and grade the submission below
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Main Content */}
        <div>
          {/* Exercise Info */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Exercise Information</h2>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 className="gradient-text" style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-sm)' }}>
                {exercise.title}
              </h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                {exercise.category && <Badge variant="info">{exercise.category}</Badge>}
                {exercise.difficulty && (
                  <Badge
                    variant={
                      exercise.difficulty === 'easy'
                        ? 'success'
                        : exercise.difficulty === 'medium'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {exercise.difficulty}
                  </Badge>
                )}
                <Badge variant="secondary">{exercise.points || exercise.max_score} points</Badge>
              </div>
            </div>

            <div className="divider" style={{ margin: 'var(--spacing-md) 0' }}></div>

            <div>
              <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-md)' }}>Description</h4>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-secondary)',
                }}
                dangerouslySetInnerHTML={{ __html: exercise.description || '' }}
              />
            </div>
          </Card>

          {/* Submission Details */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Submission Details</h2>

            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)', display: 'block' }}>
                  Submitted Flag
                </label>
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-lg)',
                    wordBreak: 'break-all',
                  }}
                >
                  {submission.submitted_flag}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Team</label>
                  <div style={{ fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>{submission.team_name}</div>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Participant</label>
                  <div style={{ fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>{submission.username}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Submitted At</label>
                <div style={{ fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>
                  {new Date(submission.submitted_at).toLocaleString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Grading Form */}
          <Card>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Grade This Submission</h2>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
              <Button
                variant={gradingData.is_correct ? 'success' : 'outline'}
                onClick={handleAccept}
                block
              >
                ✓ Accept ({exercise.points || exercise.max_score} pts)
              </Button>
              <Button
                variant={!gradingData.is_correct ? 'error' : 'outline'}
                onClick={handleReject}
                block
              >
                ✗ Reject (0 pts)
              </Button>
            </div>

            <Input
              type="number"
              label="Points Awarded"
              value={gradingData.points_awarded}
              onChange={(e) =>
                setGradingData({ ...gradingData, points_awarded: parseInt(e.target.value) || 0 })
              }
              help={`Maximum points for this exercise: ${exercise.points || exercise.max_score}`}
            />

            <Textarea
              label="Feedback"
              placeholder="Provide feedback to the participant..."
              value={gradingData.feedback}
              onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
              rows={6}
              required
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
              <Button variant="ghost" onClick={() => navigate('/judge/queue')} disabled={grading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitGrade}
                loading={grading}
                style={{ flex: 1 }}
              >
                {grading ? 'Submitting...' : 'Submit Grade'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>Grading Guide</h3>

            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Review Checklist:</strong>
                <ul style={{ marginTop: 'var(--spacing-xs)', paddingLeft: 'var(--spacing-lg)' }}>
                  <li>Check if flag format is correct</li>
                  <li>Verify flag matches expected value</li>
                  <li>Consider case sensitivity</li>
                  <li>Provide constructive feedback</li>
                </ul>
              </div>

              <Alert variant="info" style={{ marginBottom: 'var(--spacing-md)' }}>
                <strong>Tip:</strong> Always provide specific feedback to help participants learn.
              </Alert>

              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Max Points
                </div>
                <div className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
                  {exercise.points || exercise.max_score}
                </div>
              </div>
            </div>
          </Card>

          {exercise.hints && exercise.hints.length > 0 && (
            <Card style={{ marginTop: 'var(--spacing-md)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)' }}>Available Hints</h3>
              {exercise.hints.map((hint, index) => (
                <div
                  key={hint.id}
                  style={{
                    padding: 'var(--spacing-sm)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                    Hint {index + 1} (-{hint.penalty_points} pts)
                  </div>
                  <div>{hint.hint_text}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default GradeSubmission
