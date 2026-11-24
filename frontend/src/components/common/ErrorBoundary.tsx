import React from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught component error:', error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#FAF8F3] dark:bg-[#080908]">
        <div className="w-full max-w-md bg-white dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-[#DC2626] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading font-bold text-lg text-[#080908] dark:text-[#FAF8F3]">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
              {this.state.errorMessage}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <a
              href="/home"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D5] dark:border-[#232621] bg-white dark:bg-[#181A16] text-[#080908] dark:text-[#FAF8F3] text-xs font-semibold hover:bg-[#FAF8F3] dark:hover:bg-[#1E201C] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

