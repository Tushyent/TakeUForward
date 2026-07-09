import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const PendingApproval = () => {
  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
      window.location.href = '/login';
    }
  };

  return (
    <div className="login-root">
      <div style={{ margin: 'auto', maxWidth: '500px', padding: 'var(--space-8)', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'inline-flex', padding: 'var(--space-4)', background: 'var(--warning-bg)', borderRadius: '50%', marginBottom: 'var(--space-4)' }}>
          <ShieldAlert size={40} color="var(--warning)" />
        </div>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Account Pending Review</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
          Welcome to TakeUForward! Since you registered with a non-SSN email and did not use an invite token, your Alumni account is currently <strong>pending administrator approval</strong>.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Please wait for an admin to verify your credentials. You will be able to access the community once approved.
        </p>
        <button className="btn" onClick={handleLogout} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
