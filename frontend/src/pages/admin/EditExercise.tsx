import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Alert, LoadingSpinner, Badge } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import { Exercise, UpdateExerciseRequest } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const EditExercise = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateExerciseRequest>({
    title: '',
    description: '',
    instructions: '',
    rubric: '',
    type: 'coding',
    max_score: 100,
    time_limit_minutes: undefined,
  })

  useEffect(() => {
    loadExercise()
  }, [id])

  const loadExercise = async () => {
    if (!id) {
      toast.error('Invalid exercise ID')
      navigate('/admin/exercises')
      return
    }

    try {
      setLoading(true)
      const data = await exerciseService.getById(parseInt(id))
      setExercise(data)
      setFormData({
        title: data.title,
        description: data.description || '',
        instructions: data.instructions || '',
        rubric: data.rubric || '',
        type: data.type,
        max_score: data.max_score,
        time_limit_minutes: data.time_limit_minutes || undefined,
      })
    } catch (error: any) {
      toast.error('Failed to load exercise')
      navigate('/admin/exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id || !exercise) {
      return
    }

    if (!formData.title?.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.type) {
      toast.error('Exercise type is required')
      return
    }

    try {
      setSaving(true)
      await exerciseService.update(parseInt(id), formData)
      toast.success('Exercise updated successfully!')
      navigate('/admin/exercises')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update exercise')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed' | 'cancelled') => {
    if (!id || !exercise) return

    try {
      await exerciseService.updateStatus(parseInt(id), newStatus)
      setExercise({ ...exercise, status: newStatus })
      toast.success(`Exercise status changed to ${newStatus}`)
    } catch (error: any) {
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading exercise..." />
  }

  if (!exercise) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Edit Exercise
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Exercise ID: {exercise.id} | Hackathon ID: {exercise.hackathon_id}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/exercises')}>
          ← Back to Exercises
        </Button>
      </div>

      {/* Status Card */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>Exercise Status</h3>
            <Badge
              variant={exercise.status === 'active' ? 'success' : exercise.status === 'draft' ? 'secondary' : 'info'}
            >
              {exercise.status.charAt(0).toUpperCase() + exercise.status.slice(1)}
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button
              variant={exercise.status === 'draft' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('draft')}
              disabled={exercise.status === 'draft'}
            >
              Draft
            </Button>
            <Button
              variant={exercise.status === 'active' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={exercise.status === 'active'}
            >
              Active
            </Button>
            <Button
              variant={exercise.status === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('completed')}
              disabled={exercise.status === 'completed'}
            >
              Completed
            </Button>
            <Button
              variant={exercise.status === 'cancelled' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('cancelled')}
              disabled={exercise.status === 'cancelled'}
            >
              Cancelled
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Input
              label="Exercise Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <Select
              label="Exercise Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
            >
              <option value="coding">Coding</option>
              <option value="study">Study</option>
              <option value="presentation">Presentation</option>
              <option value="deployment">Deployment</option>
              <option value="other">Other</option>
            </Select>

            <Input
              label="Max Score"
              type="number"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
              required
              min="0"
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Input
              label="Time Limit (minutes)"
              type="number"
              value={formData.time_limit_minutes || ''}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No time limit"
              min="0"
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Exercise description..."
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              Instructions (Step-by-step guide for participants)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Step-by-step instructions..."
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              Rubric (Grading criteria for judges/AI)
            </label>
            <textarea
              value={formData.rubric}
              onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Grading rubric and criteria..."
            />
          </div>

          <Alert variant="info" style={{ marginBottom: 'var(--spacing-lg)' }}>
            💡 <strong>Tip:</strong> The instructions field is shown to participants, while the rubric is used by judges and AI for grading.
          </Alert>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/exercises')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Metadata Card */}
      <Card style={{ marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Exercise Metadata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Created At
            </div>
            <div>{new Date(exercise.created_at).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Start Time
            </div>
            <div>{exercise.start_time ? new Date(exercise.start_time).toLocaleString() : 'Not set'}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              End Time
            </div>
            <div>{exercise.end_time ? new Date(exercise.end_time).toLocaleString() : 'Not set'}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Submissions
            </div>
            <div>{exercise.submission_count || 0}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EditExercise
