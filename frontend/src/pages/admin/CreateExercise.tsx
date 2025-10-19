import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Select, Alert } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import { CreateExerciseRequest, CreateFlagRequest } from '@/types/exercise.types'
import toast from 'react-hot-toast'
import 'react-markdown-editor-lite/lib/index.css'

// Dynamically import markdown editor to avoid SSR issues
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'

const mdParser = new MarkdownIt()

const CreateExercise = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateExerciseRequest>({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    points: 100,
    time_limit: undefined,
    is_active: true,
    flags: [],
  })

  const [newFlag, setNewFlag] = useState<CreateFlagRequest>({
    flag_text: '',
    points: 100,
    is_case_sensitive: true,
  })

  const handleEditorChange = ({ text }: { text: string }) => {
    setFormData({ ...formData, description: text })
  }

  const handleAddFlag = () => {
    if (!newFlag.flag_text.trim()) {
      toast.error('Flag text is required')
      return
    }

    setFormData({
      ...formData,
      flags: [...(formData.flags || []), { ...newFlag }],
    })

    setNewFlag({
      flag_text: '',
      points: 100,
      is_case_sensitive: true,
    })

    toast.success('Flag added')
  }

  const handleRemoveFlag = (index: number) => {
    const newFlags = formData.flags?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, flags: newFlags })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    if (!formData.category.trim()) {
      toast.error('Category is required')
      return
    }

    if (!formData.flags || formData.flags.length === 0) {
      toast.error('At least one flag is required')
      return
    }

    try {
      setSaving(true)
      await exerciseService.create(formData)
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
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Create Exercise
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Create a new hackathon exercise
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Basic Information</h2>

          <Input
            label="Exercise Title"
            placeholder="Enter exercise title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <Input
              label="Category"
              placeholder="e.g., Web, Crypto, Forensics"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />

            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
              required
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>

            <Input
              type="number"
              label="Points"
              placeholder="100"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              required
            />

            <Input
              type="number"
              label="Time Limit (minutes)"
              placeholder="Optional"
              value={formData.time_limit || ''}
              onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || undefined })}
            />
          </div>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Make this exercise active immediately</span>
            </label>
          </div>
        </Card>

        {/* Description */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Description</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Write the exercise description in Markdown. This will be shown to participants.
          </p>

          <MdEditor
            value={formData.description}
            style={{ height: '400px' }}
            renderHTML={(text) => mdParser.render(text)}
            onChange={handleEditorChange}
            placeholder="Enter exercise description in Markdown..."
          />
        </Card>

        {/* Flags */}
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Flags</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            Add one or more flags that participants need to find. Multiple flags can have different point values.
          </p>

          <Alert variant="info" style={{ marginBottom: 'var(--spacing-md)' }}>
            At least one flag is required. Flag text is hidden from participants.
          </Alert>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 'var(--spacing-sm)', alignItems: 'end' }}>
            <Input
              placeholder="flag{example_flag_here}"
              value={newFlag.flag_text}
              onChange={(e) => setNewFlag({ ...newFlag, flag_text: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Points"
              value={newFlag.points}
              onChange={(e) => setNewFlag({ ...newFlag, points: parseInt(e.target.value) || 0 })}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', whiteSpace: 'nowrap', padding: 'var(--spacing-sm)' }}>
              <input
                type="checkbox"
                checked={newFlag.is_case_sensitive}
                onChange={(e) => setNewFlag({ ...newFlag, is_case_sensitive: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>Case-sensitive</span>
            </label>

            <Button type="button" variant="primary" onClick={handleAddFlag}>
              Add Flag
            </Button>
          </div>

          {formData.flags && formData.flags.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--spacing-sm)' }}>
                Added Flags ({formData.flags.length})
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Flag Text</th>
                      <th>Points</th>
                      <th>Case Sensitive</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.flags.map((flag, index) => (
                      <tr key={index}>
                        <td>
                          <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                            {flag.flag_text}
                          </code>
                        </td>
                        <td>{flag.points}</td>
                        <td>
                          <span className={`badge ${flag.is_case_sensitive ? 'badge-info' : 'badge-secondary'}`}>
                            {flag.is_case_sensitive ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveFlag(index)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
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
            size="lg"
            loading={saving}
            style={{ flex: 1 }}
          >
            {saving ? 'Creating...' : 'Create Exercise'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateExercise
