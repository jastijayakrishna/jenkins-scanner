import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // P3 FIX: Verified production error logging
    if (process.env.NODE_ENV === 'production') {
      // Production-ready error tracking
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
      
      // Send to monitoring service (integrate with Sentry, LogRocket, or similar)
      console.error('Production error logged:', errorDetails)
      
      // Optional: Send to API endpoint for centralized logging
      if (typeof window !== 'undefined') {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorDetails)
        }).catch(logErr => console.warn('Failed to send error log:', logErr))
      }
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="max-w-md w-full p-6">
            <div className="rounded-lg p-6 border border-white/10 bg-white/5">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-white/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              
              <h1 className="mt-4 text-xl font-semibold text-center">
                Something went wrong
              </h1>
              
              <p className="mt-2 text-sm text-center text-white/80">
                We’re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-white/5 border border-white/10 rounded text-xs">
                  <summary className="cursor-pointer text-white/80">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-red-300">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 text-sm font-medium text-black bg-white rounded-md hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
