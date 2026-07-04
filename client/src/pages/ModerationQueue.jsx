import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ModerationQueue = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data } = await axiosClient.get('/moderation/queue');
        setPosts(data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view this page. Platform Admins only.');
        } else {
          setError('Failed to fetch moderation queue');
        }
      }
    };
    fetchQueue();
  }, [navigate]);

  const handleResolve = async (postId, action) => {
    try {
      await axiosClient.post(`/moderation/${postId}/resolve`, { action });
      setPosts(posts.filter((p) => p._id !== postId));
    } catch {
      alert('Failed to resolve post');
    }
  };

  if (error) return <div style={{ color: 'red', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/home">← Back to Home</Link>
        <h1>Moderation Queue</h1>
        {posts.length === 0 ? (
          <p>No reported posts!</p>
        ) : (
          posts.map(post => (
            <div key={post._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
              <p><strong>Reports:</strong> {post.reports?.length || 0}</p>
              <p><strong>Hidden:</strong> {post.isHidden ? 'Yes' : 'No'}</p>
              <p><strong>Author:</strong> {post.isAnonymous ? 'Anonymous' : post.authorId?.name}</p>
              <p><strong>Content:</strong> {post.content}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleResolve(post._id, 'dismiss')}
                  style={{ background: 'green', color: 'white', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}
                >
                  Dismiss (Unhide & clear reports)
                </button>
                <button 
                  onClick={() => handleResolve(post._id, 'remove')}
                  style={{ background: 'red', color: 'white', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}
                >
                  Remove (Delete permanently)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModerationQueue;
