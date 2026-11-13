'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h2 className="text-red-600">Something went wrong.</h2>
          {this.state.error && <p>{this.state.error.message}</p>}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;