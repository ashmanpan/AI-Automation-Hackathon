import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button, Input, Alert } from '@/components/common'
import authService from '@/services/auth.service'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user, isLoading, error, clearError } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || authService.getDefaultRedirect()
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const success = await login({ username, password })

    if (success) {
      // Navigation is handled by the useEffect above
      const from = (location.state as any)?.from?.pathname || authService.getDefaultRedirect()
      navigate(from, { replace: true })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Animated Background */}
      <div className="bg-animation"></div>

      {/* Login Card */}
      <div className="card animate-fade-in-up" style={{ maxWidth: '450px', width: '100%', margin: 'var(--spacing-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
            Hackathon Platform
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            Sign in to continue
          </p>
          <span className="badge badge-warning" style={{ marginTop: 'var(--spacing-md)' }}>
            🔒 Secure Login
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={clearError} className="mb-lg">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            type="text"
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={isLoading}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Environment Info & Default Credentials (Dev Only) */}
        {import.meta.env.DEV && (
          <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'rgba(0, 255, 136, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-mint)', marginBottom: 'var(--spacing-xs)' }}>
              <strong>🔧 Dev Mode</strong>
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              API: {import.meta.env.VITE_API_URL || 'http://localhost:5000'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
