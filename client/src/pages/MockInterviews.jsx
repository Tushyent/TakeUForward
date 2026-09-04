import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, UserCheck, Calendar, User, CheckCircle, ArrowRight, Search, Plus, MessageSquare, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

function MockInterviews() {
  const [openRequests, setOpenRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const [companyFilter, setCompanyFilter] = useState('');
  
  const [newTargetCompany, setNewTargetCompany] = useState('');
  const [newRequestType, setNewRequestType] = useState('both');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (companyFilter) queryParams.append('company', companyFilter);
      
      const [openRes, myRes] = await Promise.all([
        axiosClient.get(`/mock-interviews?${queryParams.toString()}`),
        axiosClient.get('/mock-interviews/my-requests')
      ]);

      setOpenRequests(openRes.data);
      setMyRequests(myRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newTargetCompany.trim()) return;

    setIsSubmitting(true);
    try {
      await axiosClient.post('/mock-interviews', { 
        targetCompany: newTargetCompany.trim(),
        requestType: newRequestType
      });
      setNewTargetCompany('');
      setNewRequestType('both');
      toast.success('Interview/Resume request posted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatch = async (id) => {
    try {
      await axiosClient.post(`/mock-interviews/${id}/match`);
      toast.success('Successfully matched! You can now message the student.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to match request');
    }
  };

  const handleClose = async (id) => {
    try {
      await axiosClient.patch(`/mock-interviews/${id}/close`);
      toast.success('Request closed.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close request');
    }
  };

  const getRequestTypeLabel = (type) => {
    if (type === 'mock_interview') return 'Mock Interview';
    if (type === 'resume_review') return 'Resume Review';
    return 'Mock Interview & Resume';
  };

  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchData }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni' && user?.isVerifiedAlumni;

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        
        {/* --- Header Section --- */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <UserCheck size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Mock Interview & Resume Pairing
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
            Pair up with verified alumni to receive 1:1 resume reviews and mock technical interviews tailored to target companies.
          </p>
        </div>

        {/* --- Request Prep Form Card (Students only) --- */}
        {isStudent && (
          <Card style={{ 
            marginBottom: 'var(--space-8)', 
            border: '1px solid var(--border)', 
            background: 'var(--bg-surface)' 
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color="var(--primary)" />
              Request Interview/Resume Prep
            </h3>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '220px' }}>
                <Input 
                  type="text" 
                  placeholder="Target Company (e.g. Google, Amazon, SSN Labs)" 
                  value={newTargetCompany}
                  onChange={e => setNewTargetCompany(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <Select 
                  value={newRequestType}
                  onChange={e => setNewRequestType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="both">Both</option>
                  <option value="mock_interview">Mock Interview</option>
                  <option value="resume_review">Resume Review</option>
                </Select>
              </div>
              <Button type="submit" variant="primary" disabled={isSubmitting || !newTargetCompany.trim()}>
                {isSubmitting ? 'Posting...' : 'Post Request'}
              </Button>
            </form>
          </Card>
        )}

        {/* --- My Requests Section (Students only) --- */}
        {isStudent && myRequests.length > 0 && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              My Requests
            </h2>
            <div className="responsive-card-grid-320">
              {myRequests.map(req => (
                <Card 
                  key={req._id} 
                  style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: 0, 
                    border: req.status === 'matched' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    padding: 'var(--space-5)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)'
                      }}>
                        <BookOpen size={14} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>{req.targetCompany}</h3>
                    </div>
                    <Badge variant={req.status === 'open' ? 'primary' : req.status === 'matched' ? 'success' : 'secondary'}>
                      {req.status}
                    </Badge>
                  </div>
                  
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Badge variant="info">{getRequestTypeLabel(req.requestType)}</Badge>
                  </div>

                  {req.status === 'matched' && req.matchedMentorId && (
                    <div style={{ 
                      marginBottom: 'var(--space-5)', 
                      padding: 'var(--space-3) var(--space-4)', 
                      background: 'rgba(52, 211, 153, 0.05)', 
                      border: '1px solid rgba(52, 211, 153, 0.15)',
                      borderRadius: 'var(--radius-md)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-2)' }}>
                        <CheckCircle size={14} color="var(--success)" />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)' }}>Matched with Mentor</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {req.matchedMentorId.name} <VerifiedAlumniBadge isVerifiedAlumni={true} />
                        </span>
                        <Link to={`/chat/${req.matchedMentorId._id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquare size={13} />
                            Message
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                      <Calendar size={13} />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    {req.status !== 'closed' && (
                      <Button variant="danger" size="sm" onClick={() => handleClose(req._id)}>
                        Close
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- Open Requests Header & Filter --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Open Requests
          </h2>
          
          <div style={{ position: 'relative', width: '280px' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              <Search size={14} />
            </div>
            <Input 
              type="text" 
              placeholder="Search target company..." 
              value={companyFilter} 
              onChange={e => setCompanyFilter(e.target.value)} 
              style={{ width: '100%', paddingLeft: '34px' }}
            />
          </div>
        </div>

        {/* --- Open Requests Grid --- */}
        {loading ? (
          <Spinner text="Loading requests..." />
        ) : openRequests.length === 0 ? (
          <EmptyState icon={UserCheck} message="No open prep requests found." />
        ) : (
          <div className="responsive-card-grid-320">
            {openRequests.map(req => {
              const matchesMyCompany = isAlumni && user?.currentCompany?.toLowerCase() === req.targetCompany.toLowerCase();
              
              return (
                <Card 
                  key={req._id} 
                  style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    padding: 'var(--space-5)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)'
                      }}>
                        <BookOpen size={14} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>{req.targetCompany}</h3>
                    </div>
                    <Badge variant="primary">OPEN</Badge>
                  </div>
                  
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Badge variant="info">{getRequestTypeLabel(req.requestType)}</Badge>
                  </div>
                  
                  <div style={{ 
                    marginBottom: 'var(--space-5)',
                    padding: 'var(--space-4)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      <User size={13} />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Requested by student</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      <Link to={`/profile/${req.requesterId?.username || ''}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {req.requesterId?.name || 'Unknown User'}
                      </Link>
                    </div>
                    {req.requesterId?.dept && req.requesterId?.year && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Badge variant="secondary" size="sm">{req.requesterId.dept}</Badge>
                        <Badge variant="secondary" size="sm">Class of {req.requesterId.year}</Badge>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                      <Calendar size={13} />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {matchesMyCompany ? (
                      <Button variant="success" size="sm" onClick={() => handleMatch(req._id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        Help Student <ArrowRight size={13} />
                      </Button>
                    ) : (
                      isAlumni && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          Target is {req.targetCompany}
                        </span>
                      )
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MockInterviews;
