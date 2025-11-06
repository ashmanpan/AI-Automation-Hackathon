import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Select, Alert } from '@/components/common'
import { useHackathonStore } from '@/store/hackathonStore'
import exerciseService from '@/services/exercise.service'
import { CreateExerciseRequest } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const CreateExercise = () => {
  const navigate = useNavigate()
  const { selectedHackathon } = useHackathonStore()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateExerciseRequest>({
    title: '',
    description: '',
    instructions: '',
    rubric: '',
    type: 'coding',
    max_score: 100,
    time_limit_minutes: undefined,
    assign_to: 'all',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedHackathon) {
      toast.error('Please select a hackathon first')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    if (!formData.type) {
      toast.error('Exercise type is required')
      return
    }

    try {
      setSaving(true)
      await exerciseService.create({
        ...formData,
        hackathon_id: selectedHackathon.id,
      })
      toast.success('Exercise created successfully!')
      navigate('/admin/exercises')
    } catch (error: any) {
      console.error('Failed to create exercise:', error)
      toast.error(error.response?.data?.error || 'Failed to create exercise')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Create Exercise
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Create a new exercise for {selectedHackathon?.name || 'the hackathon'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/exercises')}>
          ← Back to Exercises
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Basic Information</h2>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Input
              label="Exercise Title"
              placeholder="Enter exercise title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
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
              type="number"
              label="Max Score"
              placeholder="100"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
              required
              min="0"
            />

            <Input
              type="number"
              label="Time Limit (minutes)"
              placeholder="No limit"
              value={formData.time_limit_minutes || ''}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
              min="0"
            />
          </div>
        </Card>

        {/* Description */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Description</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Brief overview of the exercise. This is shown to participants in the exercise list.
          </p>

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
            placeholder="Brief description of what participants need to do..."
            required
          />
        </Card>

        {/* Instructions */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Instructions</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Step-by-step guide for participants. Be detailed and clear.
          </p>

          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: 'var(--spacing-sm)',
              fontSize: 'var(--font-size-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            placeholder="1. First step...&#10;2. Second step...&#10;3. Third step..."
          />
        </Card>

        {/* Rubric */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>
            Grading Rubric <span style={{ color: 'var(--color-primary)', fontWeight: 'normal' }}>🤖 AI-Powered</span>
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Define grading criteria for judges and AI. The more detailed, the better AI grading will work.
          </p>

          <Alert variant="info" style={{ marginBottom: 'var(--spacing-md)' }}>
            💡 <strong>AI Grading Tip:</strong> Include specific criteria like "Code quality", "Functionality", "Best practices", etc.
            The AI will use this rubric to evaluate submissions automatically.
          </Alert>

          <textarea
            value={formData.rubric}
            onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: 'var(--spacing-sm)',
              fontSize: 'var(--font-size-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            placeholder="Grading Criteria:&#10;- Code Quality (30 points): Clean, readable, well-structured code&#10;- Functionality (40 points): All features work correctly&#10;- Best Practices (20 points): Follows coding standards&#10;- Documentation (10 points): Clear comments and README"
          />
        </Card>

        {/* Assignment */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Team Assignment</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Choose which teams should receive this exercise.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.assign_to === 'all'}
              onChange={(e) => setFormData({ ...formData, assign_to: e.target.checked ? 'all' : undefined })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: 'var(--font-size-base)' }}>
              Assign to all teams in hackathon
            </span>
          </label>

          {formData.assign_to !== 'all' && (
            <Alert variant="warning" style={{ marginTop: 'var(--spacing-md)' }}>
              ⚠️ No teams will be assigned. You can assign teams later from the exercise management page.
            </Alert>
          )}
        </Card>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/exercises')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Creating Exercise...' : 'Create Exercise'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateExercise
