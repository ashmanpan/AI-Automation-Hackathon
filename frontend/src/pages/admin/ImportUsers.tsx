import { useState } from 'react'
import { Card, Button, Alert, FileInput } from '@/components/common'
import userService, { BulkImportUser } from '@/services/user.service'
import toast from 'react-hot-toast'

const ImportUsers = () => {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    imported_count: number
    failed_count: number
    errors?: Array<{ row: number; username: string; error: string }>
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const parseCSV = (text: string): BulkImportUser[] => {
    const lines = text.split('\n').filter((line) => line.trim())
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

    const users: BulkImportUser[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const user: any = {}

      headers.forEach((header, index) => {
        user[header] = values[index]
      })

      // Validate required fields
      if (user.username && user.password && user.role) {
        users.push({
          username: user.username,
          password: user.password,
          full_name: user.full_name || user.fullname,
          email: user.email,
          role: user.role as 'admin' | 'judge' | 'participant',
        })
      }
    }

    return users
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      let users: BulkImportUser[] = []

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text)
        users = Array.isArray(parsed) ? parsed : parsed.users || []
      } else if (file.name.endsWith('.csv')) {
        users = parseCSV(text)
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.')
      }

      if (users.length === 0) {
        throw new Error('No valid users found in the file')
      }

      const response = await userService.bulkImport(users)
      setResult(response)

      if (response.success) {
        toast.success(`Successfully imported ${response.imported_count} users!`)
      } else {
        toast.error(`Import completed with ${response.failed_count} errors`)
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.message || 'Failed to import users')
    } finally {
      setImporting(false)
    }
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

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          Import Users
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Bulk import users from CSV or JSON file
        </p>
      </div>

      {/* Instructions Card */}
      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>📋 Instructions</h2>
        <ol style={{ paddingLeft: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Download the CSV template or prepare a JSON file
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Fill in user information: username, password, full_name (optional), email (optional), role
          </li>
          <li style={{ marginBottom: 'var(--spacing-sm)' }}>
            Valid roles: <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>admin</code>,{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>judge</code>,{' '}
            <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>participant</code>
          </li>
          <li>Upload the file and click Import</li>
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
          accept=".csv,.json"
          onChange={handleFileChange}
          help="Supported formats: CSV, JSON (max 5MB)"
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
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Import Results</h2>

          <Alert variant={result.success ? 'success' : 'warning'}>
            <div>
              ✓ Successfully imported: <strong>{result.imported_count}</strong> users
            </div>
            {result.failed_count > 0 && (
              <div style={{ marginTop: 'var(--spacing-xs)' }}>
                ✗ Failed: <strong>{result.failed_count}</strong> users
              </div>
            )}
          </Alert>

          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Errors:</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Username</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td>{err.row}</td>
                        <td>{err.username}</td>
                        <td style={{ color: 'var(--color-error)' }}>{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default ImportUsers
