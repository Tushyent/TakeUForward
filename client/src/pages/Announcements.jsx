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
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
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
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ margin: 0 }}>Campus Announcements</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)' }}>
            Official updates from clubs, departments, and the CDC.
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)', flexWrap: 'wrap',
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Filter:</label>
          <Select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{ width: '220px' }}
            aria-label="Filter by category"
          >
            <option value="">All Announcements</option>
            <option value="event">Event</option>
            <option value="placement">Placement</option>
            <option value="hackathon">Hackathon</option>
            <option value="workshop">Workshop</option>
          </Select>
        </div>

        {loading ? (
          <Spinner text="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <EmptyState icon={BellOff} message="No announcements found." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {announcements.map(post => (
              <Card key={post._id} style={{ marginBottom: 0, padding: 'var(--space-5)' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff',
                  }}>
                    {(post.clubId?.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: 'var(--text-sm)' }}>
                        {post.clubId?.name || 'Unknown Club'}
                      </strong>
                      {post.category && (
                        <Badge variant="primary" size="sm">{post.category}</Badge>
                      )}
                    </div>
                    <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      Posted by {post.authorId?.name || 'Unknown'} &middot; {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div style={{
                  whiteSpace: 'pre-wrap', color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)', lineHeight: 1.7,
                }}>
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
