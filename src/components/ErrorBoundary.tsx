import React, { Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ns-card" style={{ padding: 24, textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--ns-loss)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--ns-text-2)', marginBottom: 12 }}>
            {this.props.fallbackMessage || 'Something went wrong loading this section.'}
          </p>
          <button
            className="ns-ai-cta"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCcw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
