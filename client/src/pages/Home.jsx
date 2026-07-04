import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

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
  const [inviteError, setInviteError] = useState('');

  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvite = async () => {
    setInviteError('');
    setInviteLink('');
    try {
      const response = await axiosClient.post('/auth/alumni/invite', {
        email: inviteEmail,
        currentCompany: 'Test Company'
      });
      setInviteLink(response.data.inviteLink);
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to generate invite');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading user data...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>TakeUForward - Home Feed</h1>
      <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer', marginBottom: '20px' }}>Logout</button>
      
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
        <button onClick={handleGenerateInvite} style={{ padding: '5px 10px', cursor: 'pointer' }}>Generate Link</button>
        
        {inviteLink && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#eef', wordBreak: 'break-all' }}>
            <strong>Invite Link:</strong> <a href={inviteLink} target="_blank" rel="noreferrer">{inviteLink}</a>
          </div>
        )}
        {inviteError && <p style={{ color: 'red' }}>{inviteError}</p>}
      </div>

      <div style={{ padding: '1rem', marginTop: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>Communities List</h3>
        {communities.length === 0 ? <p>No communities found.</p> : (
          <ul>
            {communities.map((comm) => (
              <li key={comm._id}>
                <strong>{comm.name}</strong> ({comm.type}) - {comm.memberCount} members
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Home;
