import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

import { SkeletonCard } from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { AlertTriangle, Users, Search } from 'lucide-react';

function ClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/clubs');
      setClubs(response.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      );
    }
    if (error) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load clubs"
          message={error}
          action={{ label: 'Retry', onClick: fetchClubs }}
        />
      );
    }
    if (clubs.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No clubs yet"
          message="Campus clubs will appear here once they're added by an administrator."
        />
      );
    }
    return (
      <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {clubs.map(club => (
          <Card key={club._id} lift style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'rgba(124,106,247,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}>
              <Users size={18} color="var(--primary)" />
            </div>
            <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>{club.name}</h3>
            <p style={{ flexGrow: 1, marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {club.description}
            </p>
            <Link to={`/clubs/${club._id}`} style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ width: '100%' }}>View Club →</Button>
            </Link>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Campus Clubs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Explore official clubs, society pages, and interest groups.
          </p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default ClubsList;
