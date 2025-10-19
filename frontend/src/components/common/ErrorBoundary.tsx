import { Component, ErrorInfo, ReactNode } from 'react'
import { Card, Button } from './index'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-xl)',
          }}
        >
          <Card style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-lg)' }}>
              ⚠️
            </div>
            <h1 style={{ marginBottom: 'var(--spacing-md)' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-lg)' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  textAlign: 'left',
                }}
              >
                <strong style={{ color: 'var(--color-error)' }}>
                  Error: {this.state.error.message}
                </strong>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details style={{ marginTop: 'var(--spacing-sm)' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                      Stack trace (dev only)
                    </summary>
                    <pre
                      style={{
                        fontSize: '12px',
                        marginTop: 'var(--spacing-xs)',
                        overflow: 'auto',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
              <Button variant="primary" onClick={this.handleReload}>
                🔄 Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
