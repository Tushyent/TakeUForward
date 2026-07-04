import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosClient.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/login');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading user data...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>TakeUForward - Home Feed</h1>
      <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer', marginBottom: '20px' }}>Logout</button>
      
      <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Welcome, {user?.name}</h2>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    </div>
  );
}

export default Home;
