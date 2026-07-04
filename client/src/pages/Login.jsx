import React from 'react';

function Login() {
  const handleLogin = () => {
    // Redirect to the backend Google OAuth route
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>TakeUForward</h1>
      <p>Campus Mentorship Platform</p>
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Login with Google
      </button>
    </div>
  );
}

export default Login;
