import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await axiosClient.get('/auth/me');
        setIsAuthenticated(true);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          // It's a network error (like CORS) or 500 error, NOT an explicit 401.
          setErrorMsg(err.message || 'Cannot connect to the server.');
        }
      }
    };
    verifyAuth();
  }, []);

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Connection Error</h2>
        <p style={{ color: 'var(--danger)', marginTop: '10px' }}>{errorMsg}</p>
        <p style={{ marginTop: '20px', color: 'var(--text)' }}>Please check your internet connection or try again later.</p>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return <Spinner text="Verifying session..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
