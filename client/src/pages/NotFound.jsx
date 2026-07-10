import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

function NotFound() {
  return (
    <div className="page-transition" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: 'var(--space-8)',
    }}>
      <h1 style={{ fontSize: '5rem', margin: 0, color: 'var(--primary)', lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', margin: 'var(--space-4) 0 var(--space-8)' }}>
        This page doesn't exist or has been moved.
      </p>
      <Link to="/home" style={{ textDecoration: 'none' }}>
        <Button>
          <Home size={16} style={{ marginRight: 'var(--space-2)' }} />
          Go Home
        </Button>
      </Link>
    </div>
  );
}

export default NotFound;
