import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Select, LoadingSpinner, Badge, ConfirmModal } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ManageExercises = () => {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    loadExercises()
  }, [filterDifficulty, filterCategory])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterDifficulty) params.difficulty = filterDifficulty
      if (filterCategory) params.category = filterCategory

      const data = await exerciseService.getAll(params)
      setExercises(data)
    } catch (error) {
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      await exerciseService.toggleActive(exercise.id)
      toast.success(`Exercise ${exercise.is_active ? 'deactivated' : 'activated'}`)
      loadExercises()
    } catch (error) {
      toast.error('Failed to toggle exercise status')
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
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
            label="Filter by Difficulty"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>

          <Select
            label="Filter by Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="web">Web</option>
            <option value="crypto">Crypto</option>
            <option value="forensics">Forensics</option>
            <option value="reversing">Reversing</option>
            <option value="pwn">Pwn</option>
            <option value="misc">Misc</option>
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
              {filterDifficulty || filterCategory ? 'Try adjusting your filters' : 'Create your first exercise to get started'}
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
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Points</th>
                  <th>Status</th>
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
                      <Badge variant="info">{exercise.category}</Badge>
                    </td>
                    <td>
                      <Badge variant={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </td>
                    <td>
                      <strong className="gradient-text">{exercise.points}</strong>
                    </td>
                    <td>
                      <Badge variant={exercise.is_active ? 'success' : 'secondary'}>
                        {exercise.is_active ? '✓ Active' : '✗ Inactive'}
                      </Badge>
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
                          variant={exercise.is_active ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleActive(exercise)}
                        >
                          {exercise.is_active ? 'Deactivate' : 'Activate'}
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
