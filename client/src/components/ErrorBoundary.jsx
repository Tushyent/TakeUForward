import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Detect Vite lazy-load chunk failures (caused by new deployments invalidating old hashed files)
    const isChunkError = error.name === 'ChunkLoadError' || (error.message && error.message.includes('Failed to fetch dynamically imported module'));
    
    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      // Only auto-reload if we haven't done so in the last 10 seconds (prevents infinite loop)
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_error_reload', now.toString());
        window.location.reload();
        return { hasError: true, isReloading: true };
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.state.isReloading) return;
    console.error("Uncaught rendering error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.isReloading) {
      return null; // Show blank/nothing while forcing the reload
    }
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <Card style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              We encountered an unexpected error while rendering this page.
              Your session and data are safe.
            </p>
            <Button id="error-boundary-reload" onClick={() => window.location.reload()}>
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
