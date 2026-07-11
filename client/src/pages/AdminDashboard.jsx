import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldAlert, Users, BookOpen, MessageSquareWarning, UserCheck, Trash2, RefreshCcw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const StatCard = ({ icon: Icon, label, value, variant = 'primary' }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-input)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={`var(--${variant})`} />
      </div>
      <div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{label}</p>
        <strong style={{ fontSize: 'var(--text-xl)' }}>{value}</strong>
      </div>
    </div>
  </Card>
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [resourceQuery, setResourceQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAdminData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, resourcesRes] = await Promise.all([
        axiosClient.get('/admin/overview'),
        axiosClient.get(`/admin/users?${new URLSearchParams({ q: userQuery, limit: '20' })}`),
        axiosClient.get(`/admin/resources?${new URLSearchParams({ q: resourceQuery, limit: '20' })}`)
      ]);
      setOverview(overviewRes.data);
      setUsers(usersRes.data.users);
      setResources(resourcesRes.data.resources);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [resourceQuery, userQuery]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.email} and their associated content? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/users/${user._id}`);
      toast.success('User deleted');
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const deleteResource = async (resource) => {
    if (!window.confirm(`Delete "${resource.title}" and its uploaded file? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/resources/${resource._id}`);
      toast.success('Resource deleted');
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete resource');
    }
  };

  if (loading && !overview) return <Spinner text="Loading admin dashboard..." />;

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--space-2)' }}>System Admin</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Review reports, manage support, remove inappropriate resources, and delete abusive accounts.
            </p>
          </div>
          <Button variant="secondary" onClick={loadAdminData}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <StatCard icon={Users} label="Users" value={overview?.users ?? '-'} />
          <StatCard icon={BookOpen} label="Resources" value={overview?.resources ?? '-'} variant="info" />
          <StatCard icon={MessageSquareWarning} label="Reported Posts" value={overview?.reports ?? '-'} variant="danger" />
          <StatCard icon={UserCheck} label="Pending Alumni" value={overview?.pendingAlumniRequests ?? '-'} variant="warning" />
        </div>

        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="var(--danger)" /> Review Queues
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Link to="/moderation" style={{ textDecoration: 'none' }}><Button variant="danger">Moderation Queue</Button></Link>
            <Link to="/admin/support" style={{ textDecoration: 'none' }}><Button variant="secondary">Support Queue</Button></Link>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          <Card>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>Users</h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search users" />
              <Button variant="secondary" onClick={loadAdminData}>Search</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {users.map(user => (
                <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ minWidth: 0 }}>
                    <strong>{user.name}</strong>
                    <p style={{ margin: '2px 0', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{user.email}</p>
                    <Badge variant={user.isPlatformAdmin ? 'danger' : 'secondary'}>@{user.handle || user.username || 'unknown'}</Badge>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deleteUser(user)} disabled={user.isPlatformAdmin}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>Resources</h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Input value={resourceQuery} onChange={e => setResourceQuery(e.target.value)} placeholder="Search resources" />
              <Button variant="secondary" onClick={loadAdminData}>Search</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {resources.map(resource => (
                <div key={resource._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ minWidth: 0 }}>
                    <strong>{resource.title}</strong>
                    <p style={{ margin: '2px 0', color: 'var(--text-secondary)' }}>{resource.courseCode} · {resource.uploaderId?.email || 'Unknown uploader'}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deleteResource(resource)}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
