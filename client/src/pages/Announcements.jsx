import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Select } from '../components/ui/Input';
import { BellOff, AlertTriangle } from 'lucide-react';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');

  const fetchAnnouncements = React.useCallback(async () => {
    try {
      const url = category ? `/announcements?category=${category}` : '/announcements';
      const response = await axiosClient.get(url);
      setAnnouncements(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  if (error) return (
    <div className="page-transition">
            <div className="page-col page-col-feed" style={{ paddingTop: 'var(--space-8)' }}>
        <EmptyState
          icon={AlertTriangle}
          title="Error"
          message={error}
          action={{ label: 'Retry', onClick: fetchAnnouncements }}
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
        />
      </div>
    </div>
  );

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginTop: 0 }}>Campus Announcements</h1>
        <p style={{ color: 'var(--text)', marginBottom: '2rem', fontSize: '1.1em' }}>
          Aggregated feed of all official club and CDC announcements.
        </p>

        <Card style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem 1.5rem' }}>
          <label style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Filter by Category:</label>
          <Select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Announcements</option>
            <option value="event">Event</option>
            <option value="placement">Placement</option>
            <option value="hackathon">Hackathon</option>
            <option value="workshop">Workshop</option>
          </Select>
        </Card>

        {loading ? (
          <Spinner text="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <EmptyState icon={BellOff} message="No announcements found." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {announcements.map(post => (
              <Card key={post._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '0.9em', color: 'var(--text)' }}>
                    <strong style={{ color: 'var(--primary)' }}>{post.clubId?.name || 'Unknown Club'}</strong> &bull; Posted by {post.authorId?.name}
                  </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                
                {post.category && (
                  <Badge variant="primary" style={{ marginBottom: '15px' }}>
                    {post.category}
                  </Badge>
                )}
                
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: '1.1em' }}>
                  {post.content}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
