import { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Badge, Select } from '@/components/common'
import submissionService from '@/services/submission.service'
import teamService from '@/services/team.service'
import { Submission } from '@/types/submission.types'
import toast from 'react-hot-toast'

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCorrect, setFilterCorrect] = useState<string>('')

  useEffect(() => {
    loadSubmissions()
  }, [filterCorrect])

  const loadSubmissions = async () => {
    try {
      setLoading(true)

      // Get user's team using the dedicated endpoint
      const myTeam = await teamService.getMyTeam()

      // Get team submissions
      const data = await submissionService.getTeamSubmissions(myTeam.id)

      // Filter by result if selected
      let filtered = data
      if (filterCorrect !== '') {
        filtered = data.filter(s => s.is_correct === (filterCorrect === 'true'))
      }

      setSubmissions(filtered)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      toast.error('No team assigned or failed to load submissions')
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading submissions..." />
  }

  const correctCount = submissions.filter(s => s.is_correct).length
  const incorrectCount = submissions.filter(s => !s.is_correct).length
  const totalPoints = submissions.reduce((sum, s) => sum + s.points_awarded, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          My Submissions
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Track your team's submission history
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Total Submissions
          </div>
          <div className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
            {submissions.length}
          </div>
        </Card>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Correct
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {correctCount}
          </div>
        </Card>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Incorrect
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-error)' }}>
            {incorrectCount}
          </div>
        </Card>
        <Card compact>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
            Points Earned
          </div>
          <div className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
            {totalPoints}
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
          <option value="true">Correct Only</option>
          <option value="false">Incorrect Only</option>
        </Select>
      </Card>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📭</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No submissions yet</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {filterCorrect ? 'Try adjusting your filters' : 'Start solving exercises to see your submissions here'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Submitted At</th>
                  <th>Exercise</th>
                  <th>Submitted By</th>
                  <th>Result</th>
                  <th>Points</th>
                  <th>Graded</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {new Date(submission.submitted_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <strong>{submission.exercise_title || `Exercise #${submission.exercise_id}`}</strong>
                    </td>
                    <td>{submission.username || 'Unknown'}</td>
                    <td>
                      <Badge variant={submission.is_correct ? 'success' : 'error'}>
                        {submission.is_correct ? '✓ Correct' : '✗ Incorrect'}
                      </Badge>
                    </td>
                    <td>
                      <strong className={submission.points_awarded > 0 ? 'gradient-text' : ''}>
                        +{submission.points_awarded}
                      </strong>
                    </td>
                    <td>
                      {submission.graded_at ? (
                        <Badge variant="success">✓ Graded</Badge>
                      ) : (
                        <Badge variant="warning">⏳ Pending</Badge>
                      )}
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

export default MySubmissions
