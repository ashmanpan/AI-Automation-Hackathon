import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, LoadingSpinner } from '@/components/common'

const UserGuide = () => {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMarkdown()
  }, [])

  const loadMarkdown = async () => {
    try {
      setLoading(true)
      const response = await fetch('/docs/user-guide.md')
      if (!response.ok) {
        throw new Error('Failed to load user guide')
      }
      const text = await response.text()
      setMarkdown(text)
    } catch (err) {
      console.error('Failed to load user guide:', err)
      setError('Failed to load user guide. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading user guide..." />
  }

  if (error) {
    return (
      <div>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)' }}>
          User Guide
        </h1>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>📖</div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Error Loading Guide</h3>
            <p style={{ color: 'var(--color-text-tertiary)' }}>{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          User Guide
        </h1>
        <p style={{ color: 'var(--color-text-tertiary)' }}>
          Everything you need to know about using the platform
        </p>
      </div>

      <Card>
        <div
          className="markdown-content"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: 'var(--spacing-lg)',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </Card>
    </div>
  )
}

export default UserGuide
