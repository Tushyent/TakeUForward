import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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

  if (loading) return <div><Navbar /><Spinner text="Loading clubs..." /></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>Campus Clubs</h1>

        {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {clubs.length === 0 && !error ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No clubs found.</div>
          ) : (
            clubs.map(club => (
              <Card key={club._id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ marginTop: 0 }}>{club.name}</h2>
                <p style={{ flexGrow: 1, marginBottom: '20px' }}>{club.description}</p>
                <Link to={`/clubs/${club._id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%' }}>View Club Page &rarr;</Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubsList;
