import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import SearchFilterBar from '../components/SearchFilterBar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Users, AlertCircle } from 'lucide-react';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

function TeamFinder() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create request state
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [skillsNeededStr, setSkillsNeededStr] = useState('');
  const [teamSizeNeeded, setTeamSizeNeeded] = useState('');
  const [description, setDescription] = useState('');

  // Apply state
  const [applyMessage, setApplyMessage] = useState('');
  const [applyingTo, setApplyingTo] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      


      const queryParams = new URLSearchParams(filters).toString();
      const response = await axiosClient.get(`/team-requests?${queryParams}`);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching team requests', err);
      setError('Failed to load team requests');
      toast.error('Failed to load team requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!eventName || !eventType || !teamSizeNeeded || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsNeeded = skillsNeededStr.split(',').map(s => s.trim()).filter(Boolean);
      await axiosClient.post('/team-requests', {
        eventName,
        eventType,
        skillsNeeded,
        teamSizeNeeded: Number(teamSizeNeeded),
        description
      });
      
      setEventName('');
      setEventType('');
      setSkillsNeededStr('');
      setTeamSizeNeeded('');
      setDescription('');
      
      toast.success('Team request posted successfully!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post team request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = async (reqId) => {
    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post(`/team-requests/${reqId}/apply`, { message: applyMessage });
      setRequests(requests.map(r => r._id === reqId ? data : r));
      toast.success('Successfully applied to team!');
      setApplyingTo(null);
      setApplyMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to close this team request?')) return;
    try {
      const { data } = await axiosClient.post(`/team-requests/${reqId}/close`);
      setRequests(requests.map(r => r._id === reqId ? data : r));
      toast.success('Team request closed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close request');
    }
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1>Teammate Finder</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>Find peers to team up for hackathons, projects, and competitions.</p>
        
        <SearchFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          showType={false} 
          showDept={false} 
          showCourse={false}
          showYear={false}
          showEventType={true}
          showSkill={true}
        />

        <Card style={{ marginTop: '2rem' }}>
          <form onSubmit={handleCreateRequest}>
            <h3 style={{ marginTop: 0 }}>Looking for teammates?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <Input 
                placeholder="Event/Project Name" 
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)} 
              />
              <Select 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select Type</option>
                <option value="hackathon">Hackathon</option>
                <option value="project">Project</option>
                <option value="competition">Competition</option>
                <option value="other">Other</option>
              </Select>
              <Input 
                type="number"
                placeholder="Team Size Needed" 
                value={teamSizeNeeded} 
                onChange={(e) => setTeamSizeNeeded(e.target.value)} 
                min="1"
              />
            </div>
            
            <Input 
              placeholder="Skills Needed (comma separated, e.g. React, Node.js, Design)" 
              value={skillsNeededStr} 
              onChange={(e) => setSkillsNeededStr(e.target.value)} 
              style={{ marginBottom: '15px' }}
            />
            
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project/event and what kind of teammates you are looking for..."
              style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Request'}
              </Button>
            </div>
          </form>
        </Card>

        <h2 style={{ marginTop: '3rem' }}>Open Requests</h2>
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchRequests }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading ? <Spinner text="Loading requests..." /> : requests.length === 0 ? (
          <EmptyState icon={Users} message="No team requests found. Be the first to post one!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {requests.map((req) => (
              <Card key={req._id} style={{ marginBottom: 0, opacity: req.status === 'closed' ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                      {req.eventName}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <Badge variant={req.status === 'open' ? 'success' : 'secondary'}>
                        {req.status.toUpperCase()}
                      </Badge>
                      <Badge variant="primary">{req.eventType}</Badge>
                      <Badge variant="info">Need: {req.teamSizeNeeded} people</Badge>
                    </div>
                  </div>
                  {req.authorId?._id === user?._id && req.status === 'open' && (
                    <Button variant="danger" onClick={() => handleCloseRequest(req._id)}>
                      Close Request
                    </Button>
                  )}
                </div>
                
                <p style={{ fontSize: '1.1em', marginBottom: '15px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {req.description}
                </p>

                {req.skillsNeeded && req.skillsNeeded.length > 0 && (
                  <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ alignSelf: 'center', color: 'var(--text)' }}>Skills:</strong>
                    {req.skillsNeeded.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                )}
                
                <div style={{ fontSize: '0.85em', color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Posted By: {req.authorId ? (
                      <>
                        <Link to={`/profile/${req.authorId.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          {req.authorId.name} (@{req.authorId.handle})
                        </Link>
                        {req.authorId.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={req.authorId.isVerifiedAlumni} />}
                      </>
                    ) : 'Unknown'}
                  </span>
                  <span>• {new Date(req.createdAt).toLocaleString()}</span>
                </div>

                {/* Apply section for non-authors */}
                {req.authorId?._id !== user?._id && req.status === 'open' && !req.applicants?.some(a => a.userId?._id === user?._id) && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                    {applyingTo === req._id ? (
                      <div>
                        <Input 
                          placeholder="Short message (optional, max 500 chars)..." 
                          value={applyMessage}
                          onChange={(e) => setApplyMessage(e.target.value)}
                          maxLength={500}
                          style={{ marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Button variant="success" onClick={() => handleApply(req._id)} disabled={isSubmitting}>
                            Confirm Apply
                          </Button>
                          <Button variant="secondary" onClick={() => { setApplyingTo(null); setApplyMessage(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="primary" onClick={() => setApplyingTo(req._id)}>
                        Apply to Join
                      </Button>
                    )}
                  </div>
                )}

                {req.applicants?.some(a => a.userId?._id === user?._id) && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                    <Badge variant="success">✓ You have applied</Badge>
                  </div>
                )}

                {/* Applicants view for author only */}
                {req.authorId?._id === user?._id && req.applicants?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>Applicants ({req.applicants.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {req.applicants.map((applicant, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 500, marginBottom: '5px' }}>
                              <Link to={`/profile/${applicant.userId?.username}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                {applicant.userId?.name} (@{applicant.userId?.handle})
                              </Link>
                            </div>
                            <div style={{ fontSize: '0.9em', color: 'var(--text)', fontStyle: 'italic' }}>
                              {applicant.message || 'No message provided'}
                            </div>
                          </div>
                          <Link to={`/chat/${applicant.userId?._id}`} style={{ textDecoration: 'none' }}>
                            <Button variant="success">Message</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamFinder;
