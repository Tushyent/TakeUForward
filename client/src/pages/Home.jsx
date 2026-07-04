import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axiosClient.get('/health');
        setHealth(response.data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchHealth();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>TakeUForward - Home Feed</h1>
      <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h2>Backend Health Check</h2>
        {error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : health ? (
          <pre>{JSON.stringify(health, null, 2)}</pre>
        ) : (
          <p>Loading health check...</p>
        )}
      </div>
    </div>
  );
}

export default Home;
