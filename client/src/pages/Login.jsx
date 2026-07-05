import React from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
function Login() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get('error');

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <Card style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ marginTop: 0, marginBottom: '10px' }}>TakeUForward</h1>
        <p style={{ color: 'var(--text)', marginBottom: '30px', fontSize: '1.1em' }}>Campus Mentorship Platform</p>
        
        {errorParam === 'domain' && (
          <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '15px', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>
            Login failed: You must use your official college email address.
          </div>
        )}

        <button 
          onClick={handleLogin} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '16px',
            backgroundColor: '#ffffff',
            color: '#757575',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: 500,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>
      </Card>
    </div>
  );
}

export default Login;
