import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

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
    return <div style={{ padding: '2rem' }}>Loading user data...</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>TakeUForward - Home Feed</h1>
      
      <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Welcome, {user?.name}</h2>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        {user?.currentCompany && <p>Company: {user?.currentCompany}</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <div style={{ padding: '1rem', border: '1px dashed #666', borderRadius: '8px' }}>
        <h3>[Test] Generate Alumni Invite</h3>
        <input 
          type="email" 
          placeholder="Alumnus email" 
          value={inviteEmail} 
          onChange={(e) => setInviteEmail(e.target.value)}
          style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={handleGenerateInvite} disabled={isSubmitting} style={{ padding: '5px 10px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
          {isSubmitting ? 'Generating...' : 'Generate Link'}
        </button>
        
        {inviteLink && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#eef', wordBreak: 'break-all' }}>
            <strong>Invite Link:</strong> <a href={inviteLink} target="_blank" rel="noreferrer">{inviteLink}</a>
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', marginTop: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>Academic Resources</h3>
        <p>Access notes, previous year question papers, and study materials.</p>
        <Link to="/resources" style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
          Browse Resources &rarr;
        </Link>
      </div>

      <div style={{ padding: '1rem', marginTop: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>Campus Clubs</h3>
        <p>View official clubs and their announcements.</p>
        <Link to="/clubs" style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
          Browse Clubs &rarr;
        </Link>
      </div>

      {user?.isPlatformAdmin && (
        <div style={{ padding: '1rem', marginTop: '20px', border: '1px solid red', borderRadius: '8px', background: '#ffe6e6' }}>
          <h3 style={{ color: 'red' }}>Moderation Queue</h3>
          <p>Review flagged and reported posts.</p>
          <Link to="/moderation" style={{ textDecoration: 'none', color: 'red', fontWeight: 'bold' }}>
            Open Moderation Dashboard &rarr;
          </Link>
        </div>
      )}

      <div style={{ padding: '1rem', marginTop: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>Communities List</h3>
        {communities.length === 0 ? <p>No communities found.</p> : (
          <ul>
            {communities.map((comm) => (
              <li key={comm._id} style={{ marginBottom: '10px' }}>
                <Link to={`/community/${comm._id}`} style={{ textDecoration: 'none', color: '#007BFF' }}>
                  <strong>{comm.name}</strong>
                </Link> 
                {' '}({comm.type}) - {comm.memberCount} members
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}

export default Home;
