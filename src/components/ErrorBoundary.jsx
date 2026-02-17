import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "red" }}>
          <h2>Something went wrong.</h2>
          <p>Please try refreshing the page or contact support.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
              <summary>Error Details (Dev Only)</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}