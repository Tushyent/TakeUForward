import React from 'react';
import { useLocation } from 'react-router-dom';

function Login() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get('error');

  const handleLogin = () => {
    // Redirect to the backend Google OAuth route
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>TakeUForward</h1>
      <p>Campus Mentorship Platform</p>
      
      {errorParam === 'domain' && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          Login failed: You must use your official college email address.
        </div>
      )}

      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Login with Google
      </button>
    </div>
  );
}

export default Login;
