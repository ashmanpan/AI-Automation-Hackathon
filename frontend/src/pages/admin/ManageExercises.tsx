import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Select, LoadingSpinner, Badge, ConfirmModal } from '@/components/common'
import { useHackathonStore } from '@/store/hackathonStore'
import exerciseService from '@/services/exercise.service'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ManageExercises = () => {
  const navigate = useNavigate()
  const { selectedHackathon } = useHackathonStore()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    if (selectedHackathon) {
      loadExercises()
    }
  }, [filterStatus, filterType, selectedHackathon])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterType) params.type = filterType
      if (selectedHackathon) params.hackathon_id = selectedHackathon.id

      console.log('Loading exercises with params:', params)
      console.log('Selected hackathon:', selectedHackathon)

      const data = await exerciseService.getAll(params)
      console.log('Exercises loaded:', data)
      setExercises(data || [])
    } catch (error: any) {
      console.error('Failed to load exercises:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.error || 'Failed to load exercises')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      const newStatus = exercise.status === 'active' ? 'draft' : 'active'
      await exerciseService.updateStatus(exercise.id, newStatus)
      toast.success(`Exercise ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      loadExercises()
    } catch (error) {
      toast.error('Failed to update exercise status')
    }
  }

  const handleDelete = async () => {
    if (!selectedExercise) return

    try {
      await exerciseService.delete(selectedExercise.id)
      toast.success('Exercise deleted successfully')
      setShowDeleteModal(false)
      setSelectedExercise(null)
      loadExercises()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete exercise')
    }
  }

  const openDeleteModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowDeleteModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'info'
      case 'cancelled':
        return 'error'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading exercises..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Manage Exercises
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Create and manage hackathon exercises
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/exercises/create')}>
          ✍️ Create Exercise
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Select
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select
            label="Filter by Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="coding">Coding</option>
            <option value="study">Study</option>
            <option value="presentation">Presentation</option>
            <option value="deployment">Deployment</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </Card>

      {/* Exercises Table */}
      {exercises.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📝</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No exercises found</h3>
            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-lg)' }}>
              {filterStatus || filterType ? 'Try adjusting your filters' : 'Create your first exercise to get started'}
            </p>
            <Button variant="primary" onClick={() => navigate('/admin/exercises/create')}>
              Create Exercise
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Max Score</th>
                  <th>Status</th>
                  <th>Time Limit</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise) => (
                  <tr key={exercise.id}>
                    <td>
                      <strong>{exercise.title}</strong>
                    </td>
                    <td>
                      <Badge variant="info">{exercise.type}</Badge>
                    </td>
                    <td>
                      <strong className="gradient-text">{exercise.max_score}</strong>
                    </td>
                    <td>
                      <Badge variant={getStatusColor(exercise.status)}>
                        {exercise.status.charAt(0).toUpperCase() + exercise.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      {exercise.time_limit_minutes ? `${exercise.time_limit_minutes}m` : '-'}
                    </td>
                    <td>
                      {exercise.submission_count || 0}{' '}
                      <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        ({exercise.solve_count || 0} solved)
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/exercises/${exercise.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={exercise.status === 'active' ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleActive(exercise)}
                        >
                          {exercise.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteModal(exercise)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            Showing {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedExercise(null)
        }}
        onConfirm={handleDelete}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${selectedExercise?.title}"? This will also delete all associated submissions. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default ManageExercises
