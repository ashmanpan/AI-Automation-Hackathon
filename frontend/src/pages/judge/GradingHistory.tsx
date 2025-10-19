import { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Badge, Select } from '@/components/common'
import submissionService from '@/services/submission.service'
import { Submission } from '@/types/submission.types'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const GradingHistory = () => {
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCorrect, setFilterCorrect] = useState<string>('')

  useEffect(() => {
    loadHistory()
  }, [filterCorrect])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterCorrect !== '') params.is_correct = filterCorrect === 'true'

      const data = await submissionService.getAll(params)

      // Filter only submissions graded by current judge
      const gradedByMe = data.filter((sub) => sub.graded_by === user?.id && sub.graded_at)
      setSubmissions(gradedByMe)
    } catch (error) {
      toast.error('Failed to load grading history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading history..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Grading History
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Your grading activity and statistics
        </p>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Total Graded
          </div>
          <div className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
            {submissions.length}
          </div>
        </Card>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Accepted
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {submissions.filter((s) => s.is_correct).length}
          </div>
        </Card>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Rejected
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-error)' }}>
            {submissions.filter((s) => !s.is_correct).length}
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Select
          label="Filter by Result"
          value={filterCorrect}
          onChange={(e) => setFilterCorrect(e.target.value)}
        >
          <option value="">All Submissions</option>
          <option value="true">Accepted Only</option>
          <option value="false">Rejected Only</option>
        </Select>
      </Card>

      {/* History Table */}
      {submissions.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📭</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No grading history</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {filterCorrect ? 'Try adjusting your filters' : 'You haven\'t graded any submissions yet'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Graded At</th>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Participant</th>
                  <th>Result</th>
                  <th>Points</th>
                  <th>Submitted Flag</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {submission.graded_at
                          ? new Date(submission.graded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {submission.graded_at
                          ? new Date(submission.graded_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </td>
                    <td>
                      <strong>{submission.team_name || 'Unknown'}</strong>
                    </td>
                    <td>{submission.exercise_title || `Exercise #${submission.exercise_id}`}</td>
                    <td>{submission.username || 'Unknown'}</td>
                    <td>
                      <Badge variant={submission.is_correct ? 'success' : 'error'}>
                        {submission.is_correct ? '✓ Accepted' : '✗ Rejected'}
                      </Badge>
                    </td>
                    <td>
                      <strong className={submission.points_awarded > 0 ? 'gradient-text' : ''}>
                        {submission.points_awarded}
                      </strong>
                    </td>
                    <td>
                      <code
                        style={{
                          background: 'var(--color-bg-secondary)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {submission.submitted_flag.length > 25
                          ? `${submission.submitted_flag.substring(0, 25)}...`
                          : submission.submitted_flag}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            Showing {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </div>
        </Card>
      )}
    </div>
  )
}

export default GradingHistory
