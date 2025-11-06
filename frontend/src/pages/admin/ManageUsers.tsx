import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert, FileInput, Modal, Input, Select, LoadingSpinner, Badge, ConfirmModal } from '@/components/common'
import { useHackathonStore } from '@/store/hackathonStore'
import { useAuthStore } from '@/store/authStore'
import userService, { CreateUserRequest } from '@/services/user.service'
import teamService from '@/services/team.service'
import { User } from '@/types/user.types'
import toast from 'react-hot-toast'

interface ImportResult {
  message: string
  credentials: Array<{
    id: number
    username: string
    password: string
    full_name: string
    email: string | null
    role: string
  }>
}

const ManageUsers = () => {
  const navigate = useNavigate()
  const { selectedHackathon } = useHackathonStore()
  const { user: currentUser } = useAuthStore()

  // Import state
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Create user state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'participant'
  })

  // Users list state
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('')

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [filterRole])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterRole) params.role = filterRole

      const data = await userService.getAll(params)
      setUsers(data || [])
    } catch (error: any) {
      console.error('Failed to load users:', error)
      toast.error(error.response?.data?.error || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const response = await userService.bulkImport(file)
      setResult(response)
      toast.success(response.message || `Successfully imported ${response.credentials.length} users!`)
      loadUsers() // Refresh user list
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.response?.data?.error || 'Failed to import users')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadCredentials = () => {
    if (!result) return

    const csvContent = [
      'ID,Username,Password,Full Name,Email,Role',
      ...result.credentials.map((c) =>
        `${c.id},${c.username},${c.password},"${c.full_name}",${c.email || ''},${c.role}`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-credentials-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Credentials downloaded')
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await userService.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'user-import-template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Template downloaded')
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.full_name) {
      toast.error('Username, password, and full name are required')
      return
    }

    try {
      setCreating(true)
      await userService.create(newUser)
      toast.success(`User ${newUser.username} created successfully`)
      setShowCreateModal(false)
      setNewUser({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: 'participant'
      })
      loadUsers() // Refresh user list
    } catch (error: any) {
      console.error('Failed to create user:', error)
      toast.error(error.response?.data?.error || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleAutoCreateTeams = async () => {
    if (!selectedHackathon) {
      toast.error('Please select a hackathon first')
      return
    }

    if (!result || result.credentials.length === 0) {
      toast.error('No users to create teams for')
      return
    }

    setCreatingTeams(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const user of result.credentials) {
        try {
          // Create team with user's name
          const team = await teamService.create({
            name: user.full_name,
            hackathon_id: selectedHackathon.id,
          })

          // Add user to their team
          await teamService.addMember(team.id, user.id)
          successCount++
        } catch (error: any) {
          console.error(`Failed to create team for ${user.full_name}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} individual teams successfully!`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} teams`)
      }
    } catch (error: any) {
      toast.error('Failed to auto-create teams')
    } finally {
      setCreatingTeams(false)
    }
  }

  const openDeleteModal = (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      toast.error('You cannot delete your own account')
      return
    }
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    // Extra safety check: prevent deleting own account
    if (currentUser && selectedUser.id === currentUser.id) {
      toast.error('You cannot delete your own account')
      setShowDeleteModal(false)
      return
    }

    try {
      setDeleting(true)
      await userService.delete(selectedUser.id)
      toast.success(`User ${selectedUser.username} deleted successfully`)
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers() // Refresh list
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.error || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'judge':
        return 'warning'
      case 'participant':
        return 'info'
      default:
        return 'secondary'
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Manage Users
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Import users, create individual accounts, and manage all users
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Single User
        </Button>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        {selectedHackathon && (
          <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'rgba(0, 255, 136, 0.1)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Context: <strong className="gradient-text">{selectedHackathon.name}</strong>
            </span>
          </div>
        )}
      </div>

      {!selectedHackathon && (
        <Alert variant="warning" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <strong>⚠️ No hackathon selected</strong><br/>
          Users can be imported without a hackathon, but you'll need to assign them to teams in a specific hackathon later.
        </Alert>
      )}

      {/* Import Section */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>📥 Bulk Import Users</h2>
        <Alert variant="info" style={{ marginBottom: 'var(--spacing-md)' }}>
          <strong>Auto-Generated Credentials:</strong> The system will automatically generate secure usernames and passwords for each user!
        </Alert>

        <ol style={{ paddingLeft: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Download the CSV template
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Fill in <strong>only</strong>: <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>full_name</code>,{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>email</code> (optional),{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>role</code>
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Valid roles: <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>admin</code>,{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>judge</code>,{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>participant</code>
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Upload the CSV file and click Import
          </li>
          <li>
            <strong>Download the generated credentials</strong> to distribute to users
          </li>
        </ol>

        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          📥 Download CSV Template
        </Button>

        <FileInput
          accept=".csv"
          onChange={handleFileChange}
          help="CSV format only: full_name,email,role"
        />

        {file && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleImport}
          loading={importing}
          disabled={!file || importing}
          style={{ marginTop: 'var(--spacing-lg)' }}
        >
          {importing ? 'Importing...' : 'Import Users'}
        </Button>
      </Card>

      {/* Import Result Card */}
      {result && (
        <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2>Import Results</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              {selectedHackathon && (
                <Button
                  variant="success"
                  onClick={handleAutoCreateTeams}
                  loading={creatingTeams}
                  disabled={creatingTeams}
                >
                  🚀 Create Individual Teams
                </Button>
              )}
              <Button variant="primary" onClick={handleDownloadCredentials}>
                📥 Download Credentials
              </Button>
            </div>
          </div>

          <Alert variant="success">
            ✓ Successfully imported <strong>{result.credentials.length}</strong> users with auto-generated credentials
          </Alert>

          <Alert variant="warning" style={{ marginTop: 'var(--spacing-md)' }}>
            <strong>⚠️ Important:</strong> Download the credentials CSV now! Passwords are only shown once and cannot be retrieved later.
          </Alert>

          <Alert variant="info" style={{ marginTop: 'var(--spacing-md)' }}>
            <strong>📋 Next Step:</strong> Choose how to organize participants:
            <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              {selectedHackathon && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAutoCreateTeams}
                  loading={creatingTeams}
                  disabled={creatingTeams}
                >
                  🚀 Auto-Create Individual Teams
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => navigate('/admin/teams')}>
                📝 Manually Create/Assign Teams →
              </Button>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
              <strong>Individual teams:</strong> Each user gets their own team (solo participation)<br/>
              <strong>Manual teams:</strong> Group multiple users into teams (team-based competition)
            </p>
          </Alert>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Generated User Credentials:</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {result.credentials.map((cred) => (
                    <tr key={cred.id}>
                      <td>{cred.full_name}</td>
                      <td>
                        <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {cred.username}
                        </code>
                      </td>
                      <td>
                        <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)' }}>
                          {cred.password}
                        </code>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{cred.email || '—'}</td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(cred.role)}>
                          {cred.role}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* All Users List */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2>👥 All Users</h2>
          <Select
            label=""
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="judge">Judge</option>
            <option value="participant">Participant</option>
          </Select>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading users..." />
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>👥</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No users found</h3>
            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-lg)' }}>
              {filterRole ? 'Try adjusting your filter' : 'Import users or create a single user to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.full_name}</strong>
                      </td>
                      <td>
                        <code style={{ background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {user.username}
                        </code>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {user.email || '—'}
                      </td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          disabled={currentUser?.id === user.id}
                          title={currentUser?.id === user.id ? 'You cannot delete your own account' : 'Delete user'}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Single User"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder="Enter username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Enter password"
            required
          />
          <Input
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            placeholder="Enter full name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Enter email (optional)"
          />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'judge' | 'participant' })}
          >
            <option value="participant">Participant</option>
            <option value="judge">Judge</option>
            <option value="admin">Admin</option>
          </Select>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${selectedUser?.username}" (${selectedUser?.full_name})? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default ManageUsers
