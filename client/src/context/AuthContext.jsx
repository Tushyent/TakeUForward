import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [profileComplete, setProfileComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAuth = async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      setUser(response.data.user);
      setProfileComplete(response.data.profileComplete);
      setIsAuthenticated(true);
      setErrorMsg(null);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        // Network or 500 errors
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Connection Error</h2>
        <p style={{ color: 'var(--danger)', marginTop: '10px' }}>{errorMsg}</p>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Please check your internet connection or try again later.</p>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return <Spinner text="Verifying session..." />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, profileComplete, fetchAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
