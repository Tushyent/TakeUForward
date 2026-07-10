import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught rendering error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <Card style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              We encountered an unexpected error while rendering this page.
            </p>
            {this.state.error && (
              <pre style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', fontSize: '0.85rem', marginBottom: '24px', color: 'var(--text-muted)' }}>
                {this.state.error.toString()}
              </pre>
            )}
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
