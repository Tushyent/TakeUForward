import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import { Input, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, Search } from 'lucide-react';

function AlumniDirectory() {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [companyFilter, setCompanyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchAlumni = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (companyFilter) queryParams.append('company', companyFilter);
      if (deptFilter) queryParams.append('dept', deptFilter);
      
      const response = await axiosClient.get(`/alumni?${queryParams.toString()}`);
      setAlumniList(response.data.alumni);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load alumni directory');
      }
    } finally {
      setLoading(false);
    }
  }, [companyFilter, deptFilter]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginTop: 0 }}>Alumni Directory</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1em' }}>
          Connect with verified SSN alumni across the industry.
        </p>

        <Card style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Filter by Company</label>
            <Input 
              type="text" 
              placeholder="e.g. Google, Amazon..." 
              value={companyFilter} 
              onChange={e => setCompanyFilter(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Filter by Department</label>
            <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </Select>
          </div>
        </Card>

        {error && <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchAlumni }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginBottom: '1rem' }} />}

        {loading ? (
          <Spinner text="Loading alumni..." />
        ) : alumniList.length === 0 ? (
          <EmptyState icon={Search} message="No verified alumni found matching these filters." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {alumniList.map(alumni => (
              <Card key={alumni._id} style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2em', display: 'flex', alignItems: 'center' }}>
                      <Link to={`/profile/${alumni.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {alumni.name}
                      </Link>
                      <VerifiedAlumniBadge isVerifiedAlumni={alumni.isVerifiedAlumni} style={{ marginLeft: '8px' }} />
                    </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', margin: '0 0 15px 0' }}>@{alumni.handle || alumni.username || 'unknown'}</p>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  {alumni.currentCompany && (
                    <Badge variant="primary">🏢 {alumni.currentCompany}</Badge>
                  )}
                  {alumni.dept && alumni.year && (
                    <Badge variant="secondary">🎓 {alumni.dept} '{alumni.year.toString().slice(-2)}</Badge>
                  )}
                </div>

                {alumni.bio && (
                  <p style={{ flexGrow: 1, fontSize: '0.95em', color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
                    {alumni.bio}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>⭐ {alumni.reputation ?? 0} Rep</span>
                  <Link to={`/chat/${alumni._id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="success" style={{ padding: '6px 12px', fontSize: '0.9em' }}>Message</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlumniDirectory;
