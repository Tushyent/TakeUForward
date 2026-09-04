import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Mail, UserCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { useAuth } from '../context/auth-context';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const PendingApproval = () => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasRequest, setHasRequest] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: 'CSE',
    graduationYear: new Date().getFullYear() - 2, // Default to a standard alumni year
    currentCompany: '',
    proofLink: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axiosClient.get('/auth/alumni/request-status');
        setHasRequest(response.data.hasRequest);
      } catch (err) {
        console.error('Error fetching alumni request status:', err);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    window.location.href = '/login';
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.proofLink || !formData.graduationYear) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/auth/alumni/request', {
        name: formData.name.trim(),
        email: formData.email,
        dept: formData.dept,
        graduationYear: formData.graduationYear,
        currentCompany: formData.currentCompany.trim(),
        proofLink: formData.proofLink.trim(),
        message: formData.message.trim()
      });
      toast.success('Access request submitted successfully!');
      setHasRequest(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="login-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner text="Verifying verification status..." />
      </div>
    );
  }

  return (
    <div className="login-root">
      <div style={{
        margin: 'auto',
        maxWidth: '520px',
        width: '100%',
        padding: 'var(--space-6)',
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-8) var(--space-6)',
        }}>

          {!hasRequest ? (
            /* --- RENDER ALUMNI REQUEST FORM --- */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  display: 'inline-flex',
                  padding: 'var(--space-4)',
                  background: 'var(--primary-glow)',
                  borderRadius: '50%',
                  marginBottom: 'var(--space-4)',
                }}>
                  <UserCheck size={32} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                  Alumni Access Request
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
                  Please complete the form below to request alumni status approval for this platform.
                </p>
              </div>

              <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <Input
                    type="email"
                    disabled
                    value={formData.email}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Department <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <Select
                      value={formData.dept}
                      onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="IT">IT</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Chemical">Chemical</option>
                      <option value="Biomedical">Biomedical</option>
                      <option value="Civil">Civil</option>
                      <option value="English">English</option>
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Graduation Year <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min="2000"
                      max="2029"
                      placeholder="e.g. 2020"
                      value={formData.graduationYear}
                      onChange={e => setFormData({ ...formData, graduationYear: parseInt(e.target.value, 10) || 2024 })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Current Company / Employer
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Google, Microsoft, SSN Research"
                    value={formData.currentCompany}
                    onChange={e => setFormData({ ...formData, currentCompany: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Verification Proof URL <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <Input
                    type="url"
                    required
                    placeholder="LinkedIn Profile URL or Digital Certificate link"
                    value={formData.proofLink}
                    onChange={e => setFormData({ ...formData, proofLink: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Message to Admins
                  </label>
                  <Textarea
                    placeholder="Optionally write any additional details to verify your request..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
                  {submitting ? 'Submitting Request...' : 'Submit Verification Request'}
                </Button>
              </form>
            </div>
          ) : (
            /* --- RENDER EXISTING REQUEST PENDING MESSAGE --- */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                padding: 'var(--space-4)',
                background: 'var(--warning-bg)',
                borderRadius: '50%',
                marginBottom: 'var(--space-5)',
              }}>
                <Clock size={36} color="var(--warning)" />
              </div>

              <h1 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)', fontWeight: 700 }}>
                Verification Request Pending
              </h1>

              <p style={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.7,
                fontSize: 'var(--text-sm)',
              }}>
                Your alumni request for <strong style={{ color: 'var(--text-primary)' }}>{formData.email}</strong> is pending review. An administrator is verifying your credentials.
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
                      An admin will verify your graduation details
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
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>You will receive an email</span>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      A verification notification will be sent once active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)' }}>
            <Button variant="secondary" onClick={handleLogout} style={{ width: '100%' }}>
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
