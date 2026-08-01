import React from 'react';

import { LogOut, Clock, Mail } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';

const PendingApproval = () => {
  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
    } catch {
      // silent logout
    }
    window.location.href = '/login';
  };

  return (
    <div className="login-root">
      <div style={{
        margin: 'auto',
        maxWidth: '440px',
        width: '100%',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}>
        <div style={{
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(var(--glass-surface-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-surface-blur))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          padding: 'var(--space-8) var(--space-6)',
        }}>
          <div style={{
            display: 'inline-flex',
            padding: 'var(--space-4)',
            background: 'var(--warning-bg)',
            borderRadius: '50%',
            marginBottom: 'var(--space-5)',
          }}>
            <Clock size={36} color="var(--warning)" />
          </div>

          <h1 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-xl)' }}>
            Account Pending Approval
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-5)',
            lineHeight: 1.7,
            fontSize: 'var(--text-sm)',
          }}>
            Your account is registered with a non-SSN email. An administrator needs to
            review and approve your account before you can access the platform.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
            textAlign: 'left',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Clock size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>What happens next?</span>
                <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  An admin will review your registration details
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Mail size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>You will be notified</span>
                <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  Once approved, you will be able to log in and access all features
                </p>
              </div>
            </div>
          </div>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-5)',
            lineHeight: 1.6,
          }}>
            If you believe this is a mistake, contact an administrator or sign out and
            try again with your SSN email ID.
          </p>

          <Button variant="secondary" onClick={handleLogout} style={{ width: '100%' }}>
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
