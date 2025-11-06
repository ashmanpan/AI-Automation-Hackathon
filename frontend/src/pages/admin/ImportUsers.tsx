import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Alert, FileInput } from '@/components/common'
import { useHackathonStore } from '@/store/hackathonStore'
import userService from '@/services/user.service'
import teamService from '@/services/team.service'
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

const ImportUsers = () => {
  const navigate = useNavigate()
  const { selectedHackathon } = useHackathonStore()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

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

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Import Users
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Bulk import users from CSV file
        </p>
        {selectedHackathon && (
          <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'rgba(0, 255, 136, 0.1)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Importing for: <strong className="gradient-text">{selectedHackathon.name}</strong>
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

      {/* Instructions Card */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>📋 Instructions</h2>
        <Alert variant="info" style={{ marginBottom: 'var(--spacing-md)' }}>
          <strong>Auto-Generated Credentials:</strong> The system will automatically generate secure usernames and passwords for each user!
        </Alert>

        <ol style={{ paddingLeft: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
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
          style={{ marginTop: 'var(--spacing-md)' }}
        >
          📥 Download CSV Template
        </Button>
      </Card>

      {/* Upload Card */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Upload File</h2>

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

      {/* Result Card */}
      {result && (
        <Card>
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
                        <span className={`badge ${cred.role === 'admin' ? 'badge-error' : cred.role === 'judge' ? 'badge-warning' : 'badge-info'}`}>
                          {cred.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ImportUsers
