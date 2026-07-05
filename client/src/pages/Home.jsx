import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';

function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosClient.get('/auth/me');
        if (response.data.profileComplete === false) {
          navigate('/complete-profile');
        } else {
          setUser(response.data.user);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/login');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axiosClient.get('/communities');
        setCommunities(response.data);
      } catch (err) {
        console.error('Error fetching communities', err);
      }
    };
    fetchCommunities();
  }, []);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email');
      return;
    }
    setInviteLink('');
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/alumni/invite', {
        email: inviteEmail,
        currentCompany: 'Test Company'
      });
      setInviteLink(response.data.inviteLink);
      toast.success('Invite generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <Spinner text="Loading user data..." />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>TakeUForward - Home Feed</h1>
      
        <Card>
          <h2>Welcome, {user?.name}</h2>
          <p>Email: {user?.email}</p>
          <p>Role: <Badge variant="primary">{user?.role}</Badge></p>
          {user?.currentCompany && <p>Company: {user?.currentCompany}</p>}
          {error && <p style={{ color: 'var(--danger)', marginTop: '10px' }}>Error: {error}</p>}
        </Card>

        {user?.role === 'platform_admin' && (
          <Card>
            <h3>[Test] Generate Alumni Invite</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Input 
                type="email" 
                placeholder="Alumnus email" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={handleGenerateInvite} disabled={isSubmitting} style={{ whiteSpace: 'nowrap' }}>
                {isSubmitting ? 'Generating...' : 'Generate Link'}
              </Button>
            </div>
            
            {inviteLink && (
              <div style={{ marginTop: '15px', padding: '10px', background: 'var(--code-bg)', wordBreak: 'break-all', borderRadius: '4px' }}>
                <strong>Invite Link:</strong> <a href={inviteLink} target="_blank" rel="noreferrer">{inviteLink}</a>
              </div>
            )}
          </Card>
        )}

        <Card>
          <h3>Academic Resources</h3>
          <p style={{ marginBottom: '10px' }}>Access notes, previous year question papers, and study materials.</p>
          <Link to="/resources" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Browse Resources &rarr;</Button>
          </Link>
        </Card>

        <Card>
          <h3>Campus Clubs</h3>
          <p style={{ marginBottom: '10px' }}>View official clubs and their announcements.</p>
          <Link to="/clubs" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Browse Clubs &rarr;</Button>
          </Link>
        </Card>

        {user?.isPlatformAdmin && (
          <Card style={{ borderColor: 'var(--danger)', background: 'rgba(220, 53, 69, 0.05)' }}>
            <h3 style={{ color: 'var(--danger)' }}>Moderation Queue</h3>
            <p style={{ marginBottom: '10px' }}>Review flagged and reported posts.</p>
            <Link to="/moderation" style={{ textDecoration: 'none' }}>
              <Button variant="danger">Open Moderation Dashboard &rarr;</Button>
            </Link>
          </Card>
        )}

        <Card>
          <h3>Communities List</h3>
          {communities.length === 0 ? (
            <div className="empty-state">No communities found.</div>
          ) : (
            <ul style={{ paddingLeft: '20px', margin: '10px 0 0 0' }}>
              {communities.map((comm) => (
                <li key={comm._id} style={{ marginBottom: '10px' }}>
                  <Link to={`/community/${comm._id}`} style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 500 }}>
                    {comm.name}
                  </Link> 
                  {' '}<Badge variant="secondary" style={{ marginLeft: '8px' }}>{comm.type}</Badge>
                  <span style={{ fontSize: '0.9em', color: 'var(--text)', marginLeft: '8px' }}>
                    {comm.memberCount} members
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Home;
