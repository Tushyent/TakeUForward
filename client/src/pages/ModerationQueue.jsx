import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const ModerationQueue = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [navigate]);

  const handleResolve = async (postId, action, type) => {
    setIsSubmitting(true);
    try {
      await axiosClient.post(`/moderation/${postId}/resolve`, { action, type });
      setPosts(posts.filter((p) => p._id !== postId));
      toast.success(`Item ${action === 'remove' ? 'removed' : 'dismissed'} successfully`);
    } catch {
      toast.error('Failed to resolve post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div><Navbar /><Spinner text="Loading moderation queue..." /></div>;
  if (error) return <div><Navbar /><div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>Moderation Queue</h1>
        
        {posts.length === 0 ? (
          <div className="empty-state">No reported posts! The queue is clean.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.map(post => (
              <Card key={post._id} style={{ borderColor: 'var(--danger)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <Badge variant="danger">Reports: {post.reports?.length || 0}</Badge>
                  {post.isHidden && <Badge variant="secondary">Hidden</Badge>}
                  <Badge variant="secondary">
                    Author: {post.isAnonymous ? 'Anonymous' : post.authorId?.name}
                  </Badge>
                  <Badge variant="primary" style={{ textTransform: 'capitalize' }}>
                    Type: {post.type?.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div style={{ fontSize: '1.1em', marginBottom: '20px', color: 'var(--text-h)', background: 'var(--social-bg)', padding: '15px', borderRadius: '6px' }}>
                  {post.type === 'post' && post.content}
                  {post.type === 'review' && (
                    <>
                      <strong>{post.courseCode} - {post.professorName} ({post.semester})</strong>
                      <br />Rating: {post.rating}/5<br />
                      {post.comment}
                    </>
                  )}
                  {post.type === 'interview_experience' && (
                    <>
                      <strong>{post.company} - {post.role} ({post.batchYear})</strong>
                      <br />Outcome: {post.overallOutcome}<br />
                      Rounds: {post.rounds?.length}
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button 
                    variant="success"
                    onClick={() => handleResolve(post._id, 'dismiss', post.type)}
                    disabled={isSubmitting}
                  >
                    Dismiss (Unhide)
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={() => handleResolve(post._id, 'remove', post.type)}
                    disabled={isSubmitting}
                  >
                    Remove (Delete)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationQueue;
