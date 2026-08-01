import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [profileComplete, setProfileComplete] = useState(false);
  const [isApproved, setIsApproved] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAuth = async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      setUser(response.data.user);
      setProfileComplete(response.data.profileComplete);
      setIsApproved(response.data.isApproved !== false);
      setIsAuthenticated(true);
      setErrorMsg(null);
    } catch (err) {
      const publicAuthPaths = ['/login', '/pending-approval', '/alumni-invite', '/about'];
      const isPublicAuthPath = publicAuthPaths.some(path => window.location.pathname.startsWith(path));

      if (err.response && err.response.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
      } else if (isPublicAuthPath) {
        // Allow public pages like /about, /login to render gracefully without full-screen error overlay
        setIsAuthenticated(false);
        setUser(null);
        setErrorMsg(null);
      } else {
        // Network or server connectivity errors on protected pages
        setErrorMsg(err.message || 'Cannot connect to the server.');
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2>Connection Error</h2>
        <p style={{ color: 'var(--danger)', marginTop: '10px' }}>{errorMsg}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Please check your internet connection or try again later.</p>
        <button
          onClick={fetchAuth}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return <Spinner text="Verifying session..." />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, profileComplete, isApproved, fetchAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
