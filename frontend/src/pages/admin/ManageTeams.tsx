import { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, ConfirmModal, LoadingSpinner, Badge } from '@/components/common'
import teamService from '@/services/team.service'
import { Team, CreateTeamRequest } from '@/types/team.types'
import toast from 'react-hot-toast'

const ManageTeams = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
  })

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await teamService.getAll()
      setTeams(data)
    } catch (error) {
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Team name is required')
      return
    }

    try {
      await teamService.create(formData)
      toast.success('Team created successfully')
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      loadTeams()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create team')
    }
  }

  const handleDelete = async () => {
    if (!selectedTeam) return

    try {
      await teamService.delete(selectedTeam.id)
      toast.success('Team deleted successfully')
      setShowDeleteModal(false)
      setSelectedTeam(null)
      loadTeams()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete team')
    }
  }

  const openDeleteModal = (team: Team) => {
    setSelectedTeam(team)
    setShowDeleteModal(true)
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading teams..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Manage Teams
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Create and manage hackathon teams
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🏆</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No teams yet</h3>
            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-lg)' }}>
              Create your first team to get started
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Team
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid-3">
          {teams.map((team) => (
            <Card key={team.id} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    {team.name}
                  </h3>
                  {team.description && (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {team.description}
                    </p>
                  )}
                </div>
                <Badge variant="info">{team.member_count || 0} members</Badge>
              </div>

              {team.score !== undefined && (
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'rgba(0, 255, 136, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
                    Current Score
                  </div>
                  <div className="gradient-text" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                    {team.score} pts
                  </div>
                </div>
              )}

              <div className="divider" style={{ margin: 'var(--spacing-md) 0' }}></div>

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  block
                  onClick={() => window.location.href = `/admin/teams/${team.id}`}
                >
                  View Details
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => openDeleteModal(team)}
                >
                  Delete
                </Button>
              </div>

              <div style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                Created {new Date(team.created_at).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setFormData({ name: '', description: '' })
        }}
        title="Create New Team"
      >
        <Input
          label="Team Name"
          placeholder="Enter team name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Description"
          placeholder="Enter team description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreateModal(false)
              setFormData({ name: '', description: '' })
            }}
            block
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} block>
            Create Team
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedTeam(null)
        }}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${selectedTeam?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default ManageTeams
