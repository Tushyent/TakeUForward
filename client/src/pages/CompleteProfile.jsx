import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Select } from '../components/ui/Input';
import toast from 'react-hot-toast';

function CompleteProfile() {
  const [role, setRole] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [dept, setDept] = useState('CSE');
  const [year, setYear] = useState('2028');

  // Alumni specific
  const [graduationYear, setGraduationYear] = useState('2024');
  const [currentCompany, setCurrentCompany] = useState('');
  const [previousCompany, setPreviousCompany] = useState('');
  const [higherEducation, setHigherEducation] = useState('');
  // Club specific
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');

  const { fetchAuth } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        setRole(res.data.user.role);
        if (res.data.user.currentCompany) setCurrentCompany(res.data.user.currentCompany);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchMe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let payload = {};
      if (role === 'alumni') {
        payload = { dept, graduationYear, currentCompany, previousCompany, higherEducation };
      } else if (role === 'club_admin') {
        payload = { clubName, clubDescription };
      } else {
        payload = { dept, year };
      }

      const profileRes = await axiosClient.patch('/auth/profile', payload);
      const totalUsers = profileRes.data?.totalUsers;
      if (totalUsers) {
        toast.success(`Welcome to TUF SSN! You're member #${totalUsers} - share it with your peers 🎉`, { duration: 5000 });
      } else {
        toast.success('Profile completed successfully!');
      }
      // Refresh global auth state so ProtectedRoute sees profileComplete: true
      await fetchAuth();
      window.location.href = '/home'; // Hard reload to clear any stale PWA cache chunks
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      toast.error(err.response?.data?.error || 'Failed to update profile');
      setLoading(false);
    }
  };

  if (loadingUser) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><Spinner text="Loading..." /></div>;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear + 5 - i); // roughly 2000 to currentYear+5

  return (
    <div className="page-transition page-col page-col-form" style={{ paddingBlock: 'var(--space-8)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card style={{ width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '10px' }}>Complete Your Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please provide these details to continue.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {role === 'alumni' ? (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Department</label>
                <Select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%' }} aria-label="Department">
                  <option value="EEE">Electrical & Electronics (EEE)</option>
                  <option value="ECE">Electronics & Communication (ECE)</option>
                  <option value="CSE">Computer Science & Engineering (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Chemical">Chemical Engineering</option>
                  <option value="Biomedical">Biomedical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="English">English</option>
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Graduation Year</label>
                <Select value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} style={{ width: '100%' }} aria-label="Graduation Year">
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Current Company</label>
                <Input type="text" required value={currentCompany} onChange={e => setCurrentCompany(e.target.value)} placeholder="Where are you working?" style={{ width: '100%' }} aria-label="Current Company" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Previous Company (Optional)</label>
                <Input type="text" value={previousCompany} onChange={e => setPreviousCompany(e.target.value)} placeholder="Where else have you worked?" style={{ width: '100%' }} aria-label="Previous Company" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Higher Education (Optional)</label>
                <Input type="text" value={higherEducation} onChange={e => setHigherEducation(e.target.value)} placeholder="E.g., MS at Stanford" style={{ width: '100%' }} aria-label="Higher Education" />
              </div>
            </>
          ) : role === 'club_admin' ? (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Club Name</label>
                <Input type="text" required value={clubName} onChange={e => setClubName(e.target.value)} placeholder="e.g., Coding Club" style={{ width: '100%' }} aria-label="Club Name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Club Description</label>
                <Input type="text" required value={clubDescription} onChange={e => setClubDescription(e.target.value)} placeholder="What does this club do?" style={{ width: '100%' }} aria-label="Club Description" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Department</label>
                <Select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%' }} aria-label="Department">
                  <option value="EEE">Electrical & Electronics (EEE)</option>
                  <option value="ECE">Electronics & Communication (ECE)</option>
                  <option value="CSE">Computer Science & Engineering (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Chemical">Chemical Engineering</option>
                  <option value="Biomedical">Biomedical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="English">English</option>
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Batch Year (Expected Graduation)</label>
                <Select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%' }} aria-label="Batch Year">
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--danger)', padding: '10px', background: 'var(--danger-bg)', borderRadius: '6px' }}>{error}</div>}

          <Button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Saving...' : 'Save and Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default CompleteProfile;
