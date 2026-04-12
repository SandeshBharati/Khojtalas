import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unknown error occurred';
      let errorDetails = null;

      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          errorMessage = parsedError.error;
          errorDetails = parsedError;
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Something went wrong
            </h1>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            
            {errorDetails && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono text-gray-600 overflow-auto mb-6">
                <p><strong>Operation:</strong> {errorDetails.operationType}</p>
                <p><strong>Path:</strong> {errorDetails.path}</p>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
