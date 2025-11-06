import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner, Badge, Modal, Input, Textarea } from '@/components/common'
import hackathonService from '@/services/hackathon.service'
import { Hackathon } from '@/types/hackathon.types'
import toast from 'react-hot-toast'

const ManageHackathons = () => {
  const navigate = useNavigate()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
  })

  useEffect(() => {
    loadHackathons()
  }, [])

  const loadHackathons = async () => {
    try {
      setLoading(true)
      const data = await hackathonService.getAll()
      setHackathons(data)
    } catch (error) {
      console.error('Failed to load hackathons:', error)
      toast.error('Failed to load hackathons')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (hackathon: Hackathon, newStatus: Hackathon['status']) => {
    try {
      await hackathonService.updateStatus(hackathon.id, { status: newStatus })
      toast.success(`Hackathon status changed to ${newStatus}`)
      loadHackathons()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleEdit = (hackathon: Hackathon) => {
    setSelectedHackathon(hackathon)
    setEditForm({
      name: hackathon.name,
      description: hackathon.description || '',
      start_time: hackathon.start_time ? hackathon.start_time.substring(0, 16) : '',
      end_time: hackathon.end_time ? hackathon.end_time.substring(0, 16) : '',
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedHackathon) return

    if (!editForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      await hackathonService.update(selectedHackathon.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        start_time: editForm.start_time || undefined,
        end_time: editForm.end_time || undefined,
      })
      toast.success('Hackathon updated successfully')
      setShowEditModal(false)
      loadHackathons()
    } catch (error) {
      console.error('Failed to update hackathon:', error)
      toast.error('Failed to update hackathon')
    }
  }

  const handleDeleteClick = (hackathon: Hackathon) => {
    setSelectedHackathon(hackathon)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedHackathon) return

    try {
      await hackathonService.delete(selectedHackathon.id)
      toast.success('Hackathon deleted successfully')
      setShowDeleteModal(false)
      setSelectedHackathon(null)
      loadHackathons()
    } catch (error) {
      console.error('Failed to delete hackathon:', error)
      toast.error('Failed to delete hackathon')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'error'
      default:
        return 'warning'
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading hackathons..." />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Manage Hackathons
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            {hackathons.length} hackathon{hackathons.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/hackathons/create')}
        >
          Create Hackathon
        </Button>
      </div>

      {/* Hackathons Table */}
      {hackathons.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>📅</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Hackathons</h3>
            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-lg)' }}>
              Get started by creating your first hackathon
            </p>
            <Button variant="primary" onClick={() => navigate('/admin/hackathons/create')}>
              Create Hackathon
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons.map((hackathon) => (
                  <tr key={hackathon.id}>
                    <td>
                      <div>
                        <strong>{hackathon.name}</strong>
                        {hackathon.description && (
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                            {hackathon.description.substring(0, 60)}
                            {hackathon.description.length > 60 && '...'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(hackathon.status)}>
                        {hackathon.status}
                      </Badge>
                    </td>
                    <td>
                      {hackathon.start_time ? (
                        <div>
                          {new Date(hackathon.start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Not set</span>
                      )}
                    </td>
                    <td>
                      {hackathon.end_time ? (
                        <div>
                          {new Date(hackathon.end_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Not set</span>
                      )}
                    </td>
                    <td>
                      {new Date(hackathon.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                        {/* Status Change Buttons */}
                        {hackathon.status === 'draft' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusChange(hackathon, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        {hackathon.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(hackathon, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(hackathon)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteClick(hackathon)}
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
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Hackathon"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />
          <Input
            label="Start Time"
            type="datetime-local"
            value={editForm.start_time}
            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
          />
          <Input
            label="End Time"
            type="datetime-local"
            value={editForm.end_time}
            onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Hackathon"
      >
        <div>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>
            Are you sure you want to delete <strong>{selectedHackathon?.name}</strong>?
            This action cannot be undone and will delete all associated teams, exercises, and submissions.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="error" onClick={handleDeleteConfirm}>
              Delete Hackathon
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ManageHackathons
