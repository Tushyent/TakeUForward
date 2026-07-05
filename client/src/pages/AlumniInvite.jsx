import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';

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
    <div className="page-transition" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Alumni Invite Verification</h1>
      
      {status === 'loading' && <p>Verifying invite token...</p>}
      
      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'green', fontSize: '18px' }}>{message}</p>
          <Button onClick={() => window.location.href = '/login'} style={{ marginTop: '15px' }}>
            Go to Login
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'red', fontSize: '18px' }}>{message}</p>
          <Button variant="secondary" onClick={() => window.location.href = '/login'} style={{ marginTop: '15px' }}>
            Return to Login
          </Button>
        </div>
      )}
    </div>
  );
}

export default AlumniInvite;
