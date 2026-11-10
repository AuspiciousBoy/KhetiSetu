import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('KhetiSetu caught an error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#fdf9f0] text-[#1c1c16]">
          <div className="max-w-md w-full bg-white rounded-[24px] p-8 border border-[#e6e2d9] shadow-lg text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[#08241a] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#424844] mb-6">
              An unexpected display error occurred while rendering this agricultural view. Please refresh or return to the main dashboard.
            </p>
            {this.state.error && (
              <pre className="text-left bg-[#f7f3ea] p-3 rounded-lg text-xs font-mono text-rose-700 w-full overflow-x-auto mb-6 max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#08241a] text-white font-semibold text-sm hover:bg-[#124b37] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f1eee5] text-[#08241a] font-semibold text-sm hover:bg-[#e6e2d9] transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
