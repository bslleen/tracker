import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error in app tree:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-[var(--gutter)] text-center">
        <h1 className="text-[length:var(--text-title)] text-text">Something went wrong</h1>
        <p className="max-w-sm text-[length:var(--text-body)] text-text-2">{error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-surface-2 px-4 py-2 text-[length:var(--text-body)] text-text transition-colors hover:bg-surface"
        >
          Reload
        </button>
      </main>
    )
  }
}
