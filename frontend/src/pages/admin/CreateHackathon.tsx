import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Textarea } from '@/components/common'
import hackathonService from '@/services/hackathon.service'
import toast from 'react-hot-toast'

const CreateHackathon = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setLoading(true)
      await hackathonService.create({
        name: formData.name,
        description: formData.description || undefined,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
      })
      toast.success('Hackathon created successfully')
      navigate('/admin/hackathons')
    } catch (error: any) {
      console.error('Failed to create hackathon:', error)
      toast.error(error.response?.data?.error || 'Failed to create hackathon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Create Hackathon
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Set up a new hackathon event
        </p>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Name */}
            <Input
              label="Hackathon Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., AI Automation Hackathon 2025"
              required
            />

            {/* Description */}
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about the hackathon..."
              rows={4}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              {/* Start Time */}
              <Input
                label="Start Time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />

              {/* End Time */}
              <Input
                label="End Time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>

            {/* Help Text */}
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                Note:
              </div>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                <li>Hackathons are created in <strong>draft</strong> status by default</li>
                <li>You can activate the hackathon later from the manage page</li>
                <li>Start and end times are optional and can be set later</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/hackathons')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Hackathon'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateHackathon
