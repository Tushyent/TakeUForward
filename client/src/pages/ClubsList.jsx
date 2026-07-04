import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

function ClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axiosClient.get('/clubs');
        setClubs(response.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading clubs...</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>Campus Clubs</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007BFF', marginBottom: '20px', display: 'inline-block' }}>
          &larr; Back to Home
        </Link>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {clubs.length === 0 ? (
            <p>No clubs found.</p>
          ) : (
            clubs.map(club => (
              <div key={club._id} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>{club.name}</h2>
                <p>{club.description}</p>
                <Link to={`/clubs/${club._id}`} style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
                  View Club Page &rarr;
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubsList;
