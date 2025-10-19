import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Select, LoadingSpinner, Badge } from '@/components/common'
import submissionService from '@/services/submission.service'
import { GradingQueue as GradingQueueType } from '@/types/submission.types'
import toast from 'react-hot-toast'

const GradingQueue = () => {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<GradingQueueType[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<string>('')

  useEffect(() => {
    loadQueue()
  }, [priorityFilter])

  const loadQueue = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (priorityFilter) params.priority = priorityFilter

      const data = await submissionService.getGradingQueue(params)
      setQueue(data)
    } catch (error) {
      toast.error('Failed to load grading queue')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = (submissionId: number) => {
    navigate(`/judge/grade/${submissionId}`)
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading queue..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Grading Queue
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          {queue.length} submission{queue.length !== 1 ? 's' : ''} pending review
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Select
            label="Filter by Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </Select>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outline" onClick={loadQueue} block>
              🔄 Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🎉</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Queue is empty!</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              {priorityFilter ? 'Try adjusting your filters' : 'No submissions are waiting to be graded'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Participant</th>
                  <th>Flag Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Badge
                        variant={
                          item.priority === 'high'
                            ? 'error'
                            : item.priority === 'normal'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {item.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {new Date(item.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {new Date(item.submitted_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <strong>{item.team_name}</strong>
                    </td>
                    <td>
                      <div>{item.exercise_title}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        ID: {item.exercise_id}
                      </div>
                    </td>
                    <td>{item.username}</td>
                    <td>
                      <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                        {item.submitted_flag.length > 30
                          ? `${item.submitted_flag.substring(0, 30)}...`
                          : item.submitted_flag}
                      </code>
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleGrade(item.submission_id)}
                      >
                        Grade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              Showing {queue.length} submission{queue.length !== 1 ? 's' : ''}
            </div>
            <Button variant="primary" onClick={() => queue.length > 0 && handleGrade(queue[0].submission_id)}>
              Grade Next →
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default GradingQueue
