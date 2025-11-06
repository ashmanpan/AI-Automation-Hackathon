import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner, Badge, Modal, Select, ConfirmModal } from '@/components/common'
import teamService from '@/services/team.service'
import userService from '@/services/user.service'
import { Team } from '@/types/team.types'
import { User } from '@/types/user.types'
import toast from 'react-hot-toast'

interface TeamMember extends User {
  joined_at: string
}

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (id) {
      loadTeamDetails()
    }
  }, [id])

  const loadTeamDetails = async () => {
    try {
      setLoading(true)

      // Validate team ID
      const teamId = parseInt(id!)
      if (isNaN(teamId) || teamId <= 0) {
        toast.error('Invalid team ID')
        navigate('/admin/teams')
        return
      }

      const teamData = await teamService.getById(teamId)
      setTeam(teamData)

      // Load members
      const membersData = await teamService.getMembers(teamId)
      setMembers(membersData)

      // Load available participants (not in this team)
      if (teamData.hackathon_id) {
        const unassignedData = await teamService.getUnassignedParticipants(teamData.hackathon_id)
        setAvailableUsers(unassignedData)
      }
    } catch (error) {
      toast.error('Failed to load team details')
      navigate('/admin/teams')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    try {
      setAdding(true)
      await teamService.addMember(parseInt(id!), parseInt(selectedUserId))
      toast.success('Member added successfully')
      setShowAddModal(false)
      setSelectedUserId('')
      loadTeamDetails()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await teamService.removeMember(parseInt(id!), memberToRemove.id)
      toast.success('Member removed successfully')
      setShowRemoveModal(false)
      setMemberToRemove(null)
      loadTeamDetails()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member')
    }
  }

  const openRemoveModal = (member: TeamMember) => {
    setMemberToRemove(member)
    setShowRemoveModal(true)
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading team details..." />
  }

  if (!team) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/teams')} style={{ marginBottom: 'var(--spacing-sm)' }}>
            ← Back to Teams
          </Button>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            {team.name}
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Team Management
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          ➕ Add Member
        </Button>
      </div>

      {/* Team Info Card */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Team Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
              Team Name
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
              {team.name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
              Total Members
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
              {members.length}
            </div>
          </div>
          {team.score !== undefined && (
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
                Current Score
              </div>
              <div className="gradient-text" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                {team.score} pts
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
              Created
            </div>
            <div style={{ fontSize: 'var(--font-size-md)' }}>
              {new Date(team.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Members Card */}
      <Card>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Team Members ({members.length})</h2>

        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-tertiary)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>👥</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No members yet</h3>
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>
              Add participants to this team to get started
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add First Member
            </Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 'bold' }}>{member.full_name}</td>
                    <td>
                      <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                        {member.username}
                      </code>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{member.email || '—'}</td>
                    <td>
                      <Badge variant={member.role === 'judge' ? 'warning' : 'info'}>
                        {member.role}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openRemoveModal(member)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedUserId('')
        }}
        title="Add Team Member"
      >
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            Select a participant to add to {team.name}
          </p>

          {availableUsers.length === 0 ? (
            <div style={{ padding: 'var(--spacing-lg)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No unassigned participants available. All participants have been assigned to teams.
              </p>
            </div>
          ) : (
            <Select
              label="Select Participant"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">Choose a participant...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (@{user.username})
                </option>
              ))}
            </Select>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button
            variant="ghost"
            onClick={() => {
              setShowAddModal(false)
              setSelectedUserId('')
            }}
            block
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddMember}
            loading={adding}
            disabled={!selectedUserId || adding || availableUsers.length === 0}
            block
          >
            Add Member
          </Button>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false)
          setMemberToRemove(null)
        }}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.full_name} from ${team.name}?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}

export default TeamDetails
