import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, UserCheck } from 'lucide-react';
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
        targetCompany: newTargetCompany,
        requestType: newRequestType
      });
      setNewTargetCompany('');
      setNewRequestType('both');
      toast.success('Request posted!');
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
        <h1 style={{ marginTop: 0 }}>Mock Interview & Resume Pairing</h1>
        <p style={{ color: 'var(--text)', marginBottom: '2rem', fontSize: '1.1em' }}>
          Connect students with verified alumni for 1:1 interview prep and resume reviews.
        </p>

        {isStudent && (
          <Card style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
            <h3 style={{ marginTop: 0 }}>Request Prep</h3>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Input 
                type="text" 
                placeholder="Target Company (e.g. Google)" 
                value={newTargetCompany}
                onChange={e => setNewTargetCompany(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <Select 
                value={newRequestType}
                onChange={e => setNewRequestType(e.target.value)}
              >
                <option value="both">Both</option>
                <option value="mock_interview">Mock Interview</option>
                <option value="resume_review">Resume Review</option>
              </Select>
              <Button type="submit" disabled={isSubmitting || !newTargetCompany.trim()}>
                {isSubmitting ? 'Posting...' : 'Post Request'}
              </Button>
            </form>
          </Card>
        )}

        {isStudent && myRequests.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2>My Requests</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {myRequests.map(req => (
                <Card key={req._id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 0, backgroundColor: req.status === 'matched' ? 'var(--success-bg, rgba(52, 211, 153, 0.05))' : 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>{req.targetCompany}</h3>
                    <Badge variant={req.status === 'open' ? 'primary' : req.status === 'matched' ? 'success' : 'secondary'}>
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <Badge variant="info">{getRequestTypeLabel(req.requestType)}</Badge>
                  </div>

                  {req.status === 'matched' && req.matchedMentorId && (
                    <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg)', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: 'var(--text-primary)' }}>Matched with:</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 500 }}>
                          {req.matchedMentorId.name} <VerifiedAlumniBadge isVerifiedAlumni={true} />
                        </span>
                        <Link to={`/chat/${req.matchedMentorId._id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="success" style={{ padding: '4px 8px', fontSize: '0.8em' }}>Message</Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: 'var(--text)' }}>
                      Posted {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    {req.status !== 'closed' && (
                      <Button variant="danger" style={{ padding: '4px 8px', fontSize: '0.85em' }} onClick={() => handleClose(req._id)}>
                        Close Request
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h2>Open Requests</h2>
        <Card style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
          <label style={{ display: 'block', marginRight: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>Filter by Company</label>
          <Input 
            type="text" 
            placeholder="Search company..." 
            value={companyFilter} 
            onChange={e => setCompanyFilter(e.target.value)} 
            style={{ width: '300px' }}
          />
        </Card>

        {loading ? (
          <Spinner text="Loading requests..." />
        ) : openRequests.length === 0 ? (
          <EmptyState icon={UserCheck} message="No open requests found." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {openRequests.map(req => {
              const matchesMyCompany = isAlumni && user?.currentCompany?.toLowerCase() === req.targetCompany.toLowerCase();
              
              return (
                <Card key={req._id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>{req.targetCompany}</h3>
                    <Badge variant="primary">OPEN</Badge>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <Badge variant="info" style={{ marginBottom: '10px' }}>{getRequestTypeLabel(req.requestType)}</Badge>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: 'var(--text)' }}>Requested by:</p>
                    <strong style={{ display: 'flex', alignItems: 'center' }}>
                      <Link to={`/profile/${req.requesterId?.username || ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {req.requesterId?.name || 'Unknown'} (@{req.requesterId?.handle || 'unknown'})
                      </Link>
                    </strong>
                    {req.requesterId?.dept && req.requesterId?.year && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--text)' }}>
                        {req.requesterId.dept} '{req.requesterId.year.toString().slice(-2)}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: 'var(--text)' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    
                    {matchesMyCompany && (
                      <Button variant="success" onClick={() => handleMatch(req._id)} style={{ padding: '6px 12px', fontSize: '0.9em' }}>
                        I can help
                      </Button>
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
