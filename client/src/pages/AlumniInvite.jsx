import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function AlumniInvite() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axiosClient.get(`/auth/alumni/invite/${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid or expired invite token');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Alumni Invite Verification</h1>
      
      {status === 'loading' && <p>Verifying invite token...</p>}
      
      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'green', fontSize: '18px' }}>{message}</p>
          <Link to="/login" style={{ marginTop: '15px', display: 'inline-block', padding: '10px 20px', background: '#007BFF', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'red', fontSize: '18px' }}>{message}</p>
          <Link to="/login" style={{ marginTop: '15px', display: 'inline-block', padding: '10px 20px', background: '#ccc', color: 'black', textDecoration: 'none', borderRadius: '4px' }}>
            Return to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default AlumniInvite;
