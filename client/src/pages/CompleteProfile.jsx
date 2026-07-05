import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function CompleteProfile() {
  const [dept, setDept] = useState('CSE');
  const [year, setYear] = useState('2028');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axiosClient.patch('/auth/profile', { dept, year });
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      setLoading(false);
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '15px',
    outline: 'none'
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card style={{ maxWidth: '450px', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '10px' }}>Complete Your Profile</h1>
        <p style={{ color: 'var(--text)', marginBottom: '2rem' }}>Please provide your department and batch year to continue.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={selectStyle}>
              <option value="CSE">Computer Science & Engineering (CSE)</option>
              <option value="ECE">Electronics & Communication (ECE)</option>
              <option value="EEE">Electrical & Electronics (EEE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="MECH">Mechanical Engineering (MECH)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>Batch Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>

          {error && <div style={{ color: 'var(--danger)', padding: '10px', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px' }}>{error}</div>}

          <Button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Saving...' : 'Save and Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default CompleteProfile;
