import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

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

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Complete Your Profile</h1>
      <p>Please provide your department and batch year to continue.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Department:</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="CSE">Computer Science & Engineering (CSE)</option>
            <option value="ECE">Electronics & Communication (ECE)</option>
            <option value="EEE">Electrical & Electronics (EEE)</option>
            <option value="IT">Information Technology (IT)</option>
            <option value="MECH">Mechanical Engineering (MECH)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Batch Year:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Saving...' : 'Save and Continue'}
        </button>
      </form>
    </div>
  );
}

export default CompleteProfile;
