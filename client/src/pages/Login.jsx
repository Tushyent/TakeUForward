import React from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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

        <Button onClick={handleLogin} style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
          Login with Google
        </Button>
      </Card>
    </div>
  );
}

export default Login;
