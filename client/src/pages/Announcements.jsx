import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

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

  if (error) {
    return <div><Navbar /><div style={{ padding: '2rem', color: 'red' }}>{error}</div></div>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Campus Announcements</h1>
        <p style={{ color: '#555', marginBottom: '2rem' }}>
          Aggregated feed of all official club and CDC announcements.
        </p>

        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', color: '#000' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Category:</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Announcements</option>
            <option value="event">Event</option>
            <option value="placement">Placement</option>
            <option value="hackathon">Hackathon</option>
            <option value="workshop">Workshop</option>
          </select>
        </div>

        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map(post => (
              <div key={post._id} style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                  <span>
                    <strong>{post.clubId?.name || 'Unknown Club'}</strong> &bull; Posted by {post.authorId?.name}
                  </span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                
                {post.category && (
                  <span style={{ display: 'inline-block', padding: '4px 8px', background: '#007BFF', color: 'white', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 'bold' }}>
                    {post.category.toUpperCase()}
                  </span>
                )}
                
                {/* Titles are stored in content if they were posted without title natively, 
                    or if we adapted the form, we can just show content. 
                    Wait, ClubPage form sends `title` and `content`. Post schema doesn't have `title` natively, it puts it in content?
                    Let's just render content. */}
                <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                  {post.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
