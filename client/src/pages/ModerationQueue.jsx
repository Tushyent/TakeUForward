import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ModerationQueue = () => {
  const [activeTab, setActiveTab] = useState('reported'); // 'reported' or 'alumni'
  const [posts, setPosts] = useState([]);
  const [alumniRequests, setAlumniRequests] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQueue = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: queueData } = await axiosClient.get('/moderation/queue');
      setPosts(queueData);
      
      const { data: alumniData } = await axiosClient.get('/moderation/alumni-requests');
      setAlumniRequests(alumniData);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this page. Platform Admins only.');
      } else {
        setError('Failed to fetch moderation data');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

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

  const handleAlumniAction = async (requestId, action) => {
    setIsSubmitting(true);
    try {
      await axiosClient.post(`/moderation/alumni-requests/${requestId}/${action}`);
      setAlumniRequests(alumniRequests.filter((r) => r._id !== requestId));
      toast.success(`Request ${action}d successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || `Failed to ${action} request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div><Spinner text="Loading moderation queue..." /></div>;
  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchQueue }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text-secondary)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>Moderation Dashboard</h1>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'reported' ? '2px solid var(--primary)' : 'none', color: activeTab === 'reported' ? 'var(--primary)' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setActiveTab('reported')}
          >
            Reported Content ({posts.length})
          </button>
          <button 
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'alumni' ? '2px solid var(--primary)' : 'none', color: activeTab === 'alumni' ? 'var(--primary)' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setActiveTab('alumni')}
          >
            Alumni Requests ({alumniRequests.length})
          </button>
        </div>

        {activeTab === 'reported' && (
          posts.length === 0 ? (
            <EmptyState icon={CheckCircle} message="No reported posts! The queue is clean." />
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
                
                <div style={{ fontSize: '1.1em', marginBottom: '20px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '15px', borderRadius: '6px' }}>
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
                  {post.type === 'elective_suggestion' && (
                    <>
                      <strong>{post.courseCode} - {post.courseName}</strong> ({post.semester})
                      <br />Platform: {post.platform} | Recommendation: {post.recommendation}
                      <br />{post.comment}
                    </>
                  )}
                  {post.type === 'career_roadmap' && (
                    <>
                      <strong>{post.title}</strong>
                      <br />Path: {post.careerPath} | Steps: {post.steps?.length}
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
          )
        )}

        {activeTab === 'alumni' && (
          alumniRequests.length === 0 ? (
            <EmptyState icon={CheckCircle} message="No pending alumni requests." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {alumniRequests.map(req => (
                <Card key={req._id} style={{ borderColor: 'var(--primary)' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <Badge variant="primary">New Request</Badge>
                  </div>
                  
                  <div style={{ fontSize: '1.05em', marginBottom: '20px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '15px', borderRadius: '6px', lineHeight: 1.5 }}>
                    <strong>Name:</strong> {req.name} <br/>
                    <strong>Email:</strong> {req.email} <br/>
                    <strong>Department:</strong> {req.dept} <br/>
                    <strong>Graduation Year:</strong> {req.graduationYear} <br/>
                    <strong>Company / Masters:</strong> {req.currentCompany || 'N/A'} <br/>
                    <strong>Proof Link:</strong> <a href={req.proofLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{req.proofLink}</a> <br/>
                    <strong>Message:</strong> {req.message || 'N/A'}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button 
                      variant="success"
                      onClick={() => handleAlumniAction(req._id, 'approve')}
                      disabled={isSubmitting}
                    >
                      Approve & Send Invite
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleAlumniAction(req._id, 'reject')}
                      disabled={isSubmitting}
                    >
                      Reject Request
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ModerationQueue;
