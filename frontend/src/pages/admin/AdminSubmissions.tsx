import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner, Badge } from '@/components/common'
import submissionService from '@/services/submission.service'
import { useHackathonStore } from '@/store/hackathonStore'
import { Submission } from '@/types/submission.types'
import toast from 'react-hot-toast'

const AdminSubmissions = () => {
  const navigate = useNavigate()
  const { selectedHackathon } = useHackathonStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded'>('all')

  useEffect(() => {
    if (selectedHackathon) {
      loadSubmissions()
    }
  }, [selectedHackathon, filter])

  const loadSubmissions = async () => {
    if (!selectedHackathon) return

    try {
      setLoading(true)
      const data = await submissionService.getAll({
        hackathon_id: selectedHackathon.id,
        ungraded: filter === 'ungraded' ? true : undefined
      })

      let filteredData = data
      if (filter === 'graded') {
        filteredData = data.filter(s => s.status === 'graded')
      }

      setSubmissions(filteredData)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'graded':
        return 'success'
      case 'pending':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getSubmissionTypeBadge = (type?: string) => {
    switch (type) {
      case 'file':
        return { label: 'File', variant: 'primary' as const }
      case 'text':
        return { label: 'Text', variant: 'info' as const }
      case 'url':
        return { label: 'URL', variant: 'secondary' as const }
      default:
        return { label: type || 'Unknown', variant: 'secondary' as const }
    }
  }

  if (!selectedHackathon) {
    return (
      <div>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)' }}>
          Submissions
        </h1>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>📨</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Hackathon Selected</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              Please select a hackathon from the dropdown above
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading submissions..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Submissions
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} for {selectedHackathon.name}
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'ungraded' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('ungraded')}
        >
          Ungraded
        </Button>
        <Button
          variant={filter === 'graded' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('graded')}
        >
          Graded
        </Button>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>📭</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Submissions</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {filter === 'ungraded'
                ? 'All submissions have been graded'
                : filter === 'graded'
                ? 'No graded submissions yet'
                : 'No submissions yet for this hackathon'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Participant</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const typeBadge = getSubmissionTypeBadge(submission.submission_type)
                  return (
                    <tr key={submission.id}>
                      <td>
                        <strong>{submission.team_name}</strong>
                      </td>
                      <td>{submission.exercise_title}</td>
                      <td>{submission.submitted_by_name}</td>
                      <td>
                        <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(submission.status)}>
                          {submission.status}
                        </Badge>
                      </td>
                      <td>
                        {submission.status === 'graded' && submission.score !== null
                          ? `${submission.score}/${submission.max_score}`
                          : '-'}
                      </td>
                      <td>
                        {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/judge/grade/${submission.id}`)}
                          >
                            {submission.status === 'graded' ? 'View' : 'Grade'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AdminSubmissions
