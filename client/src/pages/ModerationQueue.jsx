import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const ModerationQueue = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      await axiosClient.post(`/moderation/${postId}/resolve`, { action });
      setPosts(posts.filter((p) => p._id !== postId));
      toast.success(`Post ${action === 'remove' ? 'removed' : 'dismissed'} successfully`);
    } catch {
      toast.error('Failed to resolve post');
    } finally {
      setIsSubmitting(false);
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
                  disabled={isSubmitting}
                  style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  Dismiss (Unhide)
                </button>
                <button 
                  onClick={() => handleResolve(post._id, 'remove')}
                  disabled={isSubmitting}
                  style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  Remove (Delete)
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
