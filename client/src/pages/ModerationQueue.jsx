import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, CheckCircle, ShieldAlert, UserCheck, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';

const ModerationQueue = () => {
  const [activeTab, setActiveTab] = useState('reported'); // 'reported' or 'alumni'
  const [posts, setPosts] = useState([]);
  const [alumniRequests, setAlumniRequests] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this page. Platform Admins only.');
      } else {
        setError('Failed to fetch moderation data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div><Spinner text="Loading moderation queue..." /></div>;
  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchQueue }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        
        {/* --- Back button & Header --- */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
            }}>
              <ShieldAlert size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Moderation Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-sm)' }}>
            Manage reported posts and review alumni access registration requests.
          </p>
        </div>

        {/* --- Navigation Tabs --- */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', padding: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
          <button 
            style={{ 
              padding: '8px 16px', 
              background: activeTab === 'reported' ? 'var(--bg-surface)' : 'transparent', 
              border: activeTab === 'reported' ? '1px solid var(--border)' : '1px solid transparent', 
              color: activeTab === 'reported' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s',
              fontSize: 'var(--text-sm)'
            }}
            onClick={() => setActiveTab('reported')}
          >
            Reported Content ({posts.length})
          </button>
          <button 
            style={{ 
              padding: '8px 16px', 
              background: activeTab === 'alumni' ? 'var(--bg-surface)' : 'transparent', 
              border: activeTab === 'alumni' ? '1px solid var(--border)' : '1px solid transparent', 
              color: activeTab === 'alumni' ? '#fff' : 'var(--text-secondary)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s',
              fontSize: 'var(--text-sm)'
            }}
            onClick={() => setActiveTab('alumni')}
          >
            Alumni Requests ({alumniRequests.length})
          </button>
        </div>

        {/* --- Reported Content Tab --- */}
        {activeTab === 'reported' && (
          posts.length === 0 ? (
            <EmptyState icon={CheckCircle} message="No reported posts! The queue is clean." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {posts.map(post => (
                <Card key={post._id} style={{ border: '1px solid rgba(248, 113, 113, 0.25)', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <Badge variant="danger">Reports: {post.reports?.length || 0}</Badge>
                    {post.isHidden && <Badge variant="secondary">Hidden</Badge>}
                    <Badge variant="secondary">
                      Author: {post.isAnonymous ? 'Anonymous' : post.authorId?.name}
                    </Badge>
                    <Badge variant="primary" style={{ textTransform: 'capitalize' }}>
                      Type: {post.type?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div style={{ 
                    fontSize: 'var(--text-sm)', 
                    marginBottom: 'var(--space-4)', 
                    color: 'var(--text-primary)', 
                    background: 'var(--bg-elevated)', 
                    padding: 'var(--space-4)', 
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--danger)',
                    lineHeight: 1.6
                  }}>
                    {post.type === 'post' && post.content}
                    {post.type === 'review' && (
                      <>
                        <strong style={{ color: '#fff' }}>{post.courseCode} - {post.professorName} ({post.semester})</strong>
                        <br /><span style={{ color: 'var(--warning)', fontWeight: 600 }}>Rating: {post.rating}/5</span><br />
                        <p style={{ margin: '8px 0 0 0', fontStyle: 'italic' }}>"{post.comment}"</p>
                      </>
                    )}
                    {post.type === 'interview_experience' && (
                      <>
                        <strong style={{ color: '#fff' }}>{post.company} - {post.role} ({post.batchYear})</strong>
                        <br /><span style={{ color: 'var(--success)' }}>Outcome: {post.overallOutcome}</span><br />
                        Rounds: {post.rounds?.length}
                      </>
                    )}
                    {post.type === 'elective_suggestion' && (
                      <>
                        <strong style={{ color: '#fff' }}>{post.courseCode} - {post.courseName}</strong> ({post.semester})
                        <br />Platform: {post.platform} | Recommendation: {post.recommendation}
                        <br /><p style={{ margin: '8px 0 0 0', fontStyle: 'italic' }}>"{post.comment}"</p>
                      </>
                    )}
                    {post.type === 'career_roadmap' && (
                      <>
                        <strong style={{ color: '#fff' }}>{post.title}</strong>
                        <br />Path: {post.careerPath} | Steps: {post.steps?.length}
                      </>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button 
                      variant="secondary"
                      onClick={() => handleResolve(post._id, 'dismiss', post.type)}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      Dismiss (Keep Post)
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
                          handleResolve(post._id, 'remove', post.type);
                        }
                      }}
                      disabled={isSubmitting}
                      size="sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={13} /> Delete Post
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* --- Alumni Requests Tab --- */}
        {activeTab === 'alumni' && (
          alumniRequests.length === 0 ? (
            <EmptyState icon={UserCheck} message="No pending alumni requests." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {alumniRequests.map(req => (
                <Card key={req._id} style={{ border: '1px solid rgba(124, 106, 247, 0.25)', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <Badge variant="primary">Access Verification Request</Badge>
                  </div>
                  
                  <div style={{ 
                    fontSize: 'var(--text-sm)', 
                    marginBottom: 'var(--space-5)', 
                    color: 'var(--text-primary)', 
                    background: 'var(--bg-elevated)', 
                    padding: 'var(--space-4)', 
                    borderRadius: 'var(--radius-md)', 
                    lineHeight: 1.6 
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', width: '160px', fontWeight: 600 }}>Full Name:</td>
                          <td style={{ padding: '6px 0', color: '#fff', fontWeight: 700 }}>{req.name}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Google Email:</td>
                          <td style={{ padding: '6px 0', color: '#fff' }}>{req.email}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Department:</td>
                          <td style={{ padding: '6px 0' }}><Badge variant="secondary">{req.dept}</Badge></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Graduation Year:</td>
                          <td style={{ padding: '6px 0' }}><Badge variant="secondary">{req.graduationYear}</Badge></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Current Employer:</td>
                          <td style={{ padding: '6px 0', color: '#fff' }}>{req.currentCompany || <em style={{ color: 'var(--text-muted)' }}>Not Specified</em>}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Proof URL:</td>
                          <td style={{ padding: '6px 0' }}>
                            <a href={req.proofLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              View Verification Document <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                        {req.message && (
                          <tr>
                            <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600, verticalAlign: 'top' }}>Candidate Message:</td>
                            <td style={{ padding: '6px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{req.message}"</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button 
                      variant="danger"
                      onClick={() => {
                        if (window.confirm('Reject this registration request?')) {
                          handleAlumniAction(req._id, 'reject');
                        }
                      }}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      Reject Request
                    </Button>
                    <Button 
                      variant="success"
                      onClick={() => handleAlumniAction(req._id, 'approve')}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      Approve & Grant Access
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
