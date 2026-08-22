import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Users, BookOpen, MessageSquareWarning, UserCheck,
  RefreshCcw, Trash2, Plus, Pencil, Building2, Users2, Layers,
  FileText, UserPlus, CheckCircle, History
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const TABS = ['overview', 'clubs', 'communities', 'resources', 'posts', 'users', 'activity'];

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="admin-tab"
    style={{
      padding: 'var(--space-2) var(--space-4)',
      borderRadius: 'var(--radius-sm)',
      border: active ? '1px solid var(--accent)' : '1px solid transparent',
      background: active ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    }}
  >
    <Icon size={15} /> {label}
  </button>
);

const StatCard = ({ icon: Icon, label, value, variant = 'primary' }) => {
  const bgColors = {
    primary: 'rgba(124, 106, 247, 0.08)',
    info: 'rgba(96, 165, 250, 0.08)',
    danger: 'rgba(248, 113, 113, 0.08)',
    warning: 'rgba(251, 191, 36, 0.08)',
    secondary: 'rgba(156, 163, 175, 0.08)',
  };
  return (
    <Card style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: bgColors[variant] || bgColors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={20} color={`var(--${variant})`} />
        </div>
        <div>
          <p style={{ margin: '0 0 2px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
          <strong style={{ fontSize: 'var(--text-xl)', color: '#fff', fontWeight: 800 }}>{value}</strong>
        </div>
      </div>
    </Card>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clubs state
  const [clubs, setClubs] = useState([]);
  const [clubQuery, setClubQuery] = useState('');
  const debouncedClubQuery = useDebounce(clubQuery, 300);
  const [showClubForm, setShowClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({ name: '', description: '' });

  // Communities state
  const [communities, setCommunities] = useState([]);
  const [communityQuery, setCommunityQuery] = useState('');
  const debouncedCommunityQuery = useDebounce(communityQuery, 300);
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [communityForm, setCommunityForm] = useState({ name: '', type: 'batch', description: '' });

  // Signups state
  const [signups, setSignups] = useState([]);
  const [signupsLoading, setSignupsLoading] = useState(false);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postQuery, setPostQuery] = useState('');
  const debouncedPostQuery = useDebounce(postQuery, 300);

  // Resources state
  const [resources, setResources] = useState([]);
  const [resourceQuery, setResourceQuery] = useState('');
  const debouncedResourceQuery = useDebounce(resourceQuery, 300);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Users state
  const [adminUsers, setAdminUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const debouncedUserQuery = useDebounce(userQuery, 300);
  const [usersLoading, setUsersLoading] = useState(false);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityQuery, setActivityQuery] = useState('');
  const debouncedActivityQuery = useDebounce(activityQuery, 300);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const overviewRes = await axiosClient.get('/admin/overview');
      setOverview(overviewRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClubs = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/admin/clubs?${new URLSearchParams({ q: clubQuery, limit: '50' })}`);
      setClubs(res.data.clubs);
    } catch {
      toast.error('Failed to load clubs');
    }
  }, [debouncedClubQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCommunities = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/admin/communities?${new URLSearchParams({ q: communityQuery, limit: '50' })}`);
      setCommunities(res.data.communities);
    } catch {
      toast.error('Failed to load communities');
    }
  }, [debouncedCommunityQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPosts = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/admin/posts?${new URLSearchParams({ q: postQuery, limit: '20' })}`);
      setPosts(res.data.posts);
    } catch {
      toast.error('Failed to load posts');
    }
  }, [debouncedPostQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResources = useCallback(async () => {
    try {
      setResourcesLoading(true);
      const res = await axiosClient.get(`/admin/resources?${new URLSearchParams({ q: resourceQuery, limit: '50' })}`);
      setResources(res.data.resources);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setResourcesLoading(false);
    }
  }, [debouncedResourceQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSignups = useCallback(async () => {
    setSignupsLoading(true);
    try {
      const res = await axiosClient.get('/admin/signups?limit=15');
      setSignups(res.data.signups);
    } catch {
      toast.error('Failed to load signups');
    } finally {
      setSignupsLoading(false);
    }
  }, []);

  useEffect(() => { loadAdminData(); loadSignups(); }, [loadAdminData, loadSignups]);
  useEffect(() => { if (activeTab === 'clubs') loadClubs(); }, [activeTab, loadClubs]);
  useEffect(() => { if (activeTab === 'communities') loadCommunities(); }, [activeTab, loadCommunities]);
  useEffect(() => { if (activeTab === 'posts') loadPosts(); }, [activeTab, loadPosts]);
  useEffect(() => { if (activeTab === 'resources') loadResources(); }, [activeTab, loadResources]);

  // Club CRUD
  const openCreateClub = () => {
    setEditingClub(null);
    setClubForm({ name: '', description: '' });
    setShowClubForm(true);
  };

  const openEditClub = (club) => {
    setEditingClub(club);
    setClubForm({ name: club.name, description: club.description });
    setShowClubForm(true);
  };

  const saveClub = async () => {
    if (!clubForm.name || !clubForm.description) {
      toast.error('Name and description are required');
      return;
    }
    try {
      if (editingClub) {
        await axiosClient.put(`/admin/clubs/${editingClub._id}`, clubForm);
        toast.success('Club updated');
      } else {
        await axiosClient.post('/admin/clubs', clubForm);
        toast.success('Club created');
      }
      setShowClubForm(false);
      loadClubs();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save club');
    }
  };

  const deleteClub = async (club) => {
    if (!window.confirm(`Delete "${club.name}"? Posts linked to this club will be unlinked.`)) return;
    try {
      await axiosClient.delete(`/admin/clubs/${club._id}`);
      toast.success('Club deleted');
      loadClubs();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete club');
    }
  };

  // Community CRUD
  const openCreateCommunity = () => {
    setEditingCommunity(null);
    setCommunityForm({ name: '', type: 'batch', description: '' });
    setShowCommunityForm(true);
  };

  const openEditCommunity = (community) => {
    setEditingCommunity(community);
    setCommunityForm({ name: community.name, type: community.type, description: community.description || '' });
    setShowCommunityForm(true);
  };

  const saveCommunity = async () => {
    if (!communityForm.name || !communityForm.type) {
      toast.error('Name and type are required');
      return;
    }
    try {
      if (editingCommunity) {
        await axiosClient.put(`/admin/communities/${editingCommunity._id}`, communityForm);
        toast.success('Community updated');
      } else {
        await axiosClient.post('/admin/communities', communityForm);
        toast.success('Community created');
      }
      setShowCommunityForm(false);
      loadCommunities();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save community');
    }
  };

  const deleteCommunity = async (community) => {
    if (!window.confirm(`Delete "${community.name}"? Posts in this community will lose their community link.`)) return;
    try {
      await axiosClient.delete(`/admin/communities/${community._id}`);
      toast.success('Community deleted');
      loadCommunities();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete community');
    }
  };

  // Post delete
  const deletePost = async (post) => {
    const preview = (post.content || '').slice(0, 60);
    if (!window.confirm(`Delete post: "${preview}..."? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/posts/${post._id}`);
      toast.success('Post deleted');
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete post');
    }
  };

  const deleteResource = async (resource) => {
    if (!window.confirm(`Delete resource "${resource.title}"? The file and metadata will be permanently removed.`)) return;
    try {
      await axiosClient.delete(`/admin/resources/${resource._id}`);
      toast.success('Resource deleted');
      loadResources();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete resource');
    }
  };

  // ── Users management ──
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await axiosClient.get(`/admin/users?${new URLSearchParams({ q: userQuery, limit: '50' })}`);
      setAdminUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [debouncedUserQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab, loadUsers]);

  const loadActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      const res = await axiosClient.get(`/admin/activity?${new URLSearchParams({ q: activityQuery, limit: '50' })}`);
      setActivityLogs(res.data.logs);
    } catch {
      toast.error('Failed to load activity log');
    } finally {
      setActivityLoading(false);
    }
  }, [debouncedActivityQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (activeTab === 'activity') loadActivity(); }, [activeTab, loadActivity]);

  const approveUser = async (userId) => {
    try {
      await axiosClient.patch(`/admin/users/${userId}/approve`);
      toast.success('User approved');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve user');
    }
  };

  const deleteAdminUser = async (u) => {
    if (!window.confirm(`Delete user "${u.name || u.email}"? All their posts, comments, and content will be permanently removed.`)) return;
    try {
      await axiosClient.delete(`/admin/users/${u._id}`);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  if (loading && !overview && activeTab === 'overview') {
    return <Spinner text="Loading admin dashboard..." />;
  }

  const renderOverview = () => (
    <>
      <div className="admin-stats-grid">
        <StatCard icon={Users} label="Users" value={overview?.users ?? '-'} />
        <StatCard icon={FileText} label="Posts" value={overview?.posts ?? '-'} />
        <StatCard icon={BookOpen} label="Resources" value={overview?.resources ?? '-'} variant="info" />
        <StatCard icon={MessageSquareWarning} label="Reported Posts" value={overview?.reports ?? '-'} variant="danger" />
        <StatCard icon={UserCheck} label="Pending Alumni" value={overview?.pendingAlumniRequests ?? '-'} variant="warning" />
        <StatCard icon={Layers} label="Support Tickets" value={overview?.supportTickets ?? '-'} variant="secondary" />
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
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
            <UserPlus size={18} color="var(--primary)" /> Recent Signups
            {signupsLoading && <Spinner />}
          </h2>
          {signups.length === 0 && !signupsLoading && (
            <p style={{ color: 'var(--text-secondary)' }}>No signups yet.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
            {signups.map(u => (
              <div key={u._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                fontSize: 'var(--text-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 600, flexShrink: 0,
                  }}>
                    {(u.name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name || 'Unnamed'}
                    </span>
                    {u.email && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.email}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {u.dept && <Badge variant="secondary">{u.dept}</Badge>}
                  {u.year && <span>{u.year}</span>}
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} /> Clubs <Badge>{clubs.length || overview?.clubs || 0}</Badge>
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Input value={clubQuery} onChange={e => setClubQuery(e.target.value)} placeholder="Search clubs" />
            <Button variant="primary" size="sm" onClick={() => { setActiveTab('clubs'); }}>Manage</Button>
          </div>
        </Card>
        <Card>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users2 size={16} /> Communities <Badge>{communities.length || overview?.communities || 0}</Badge>
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Input value={communityQuery} onChange={e => setCommunityQuery(e.target.value)} placeholder="Search communities" />
            <Button variant="primary" size="sm" onClick={() => { setActiveTab('communities'); }}>Manage</Button>
          </div>
        </Card>
      </div>
    </>
  );

  const renderClubForm = () => (
    <Modal onClose={() => setShowClubForm(false)}>
      <div style={{ padding: 'var(--space-5)', minWidth: 360 }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{editingClub ? 'Edit Club' : 'Create Club'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Club Name"
            value={clubForm.name}
            onChange={e => setClubForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. SSN Coding Club"
          />
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={clubForm.description}
              onChange={e => setClubForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the club's purpose and activities"
              rows={3}
              style={{
                width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setShowClubForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveClub}>{editingClub ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );

  const renderClubs = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, maxWidth: 400 }}>
          <Input value={clubQuery} onChange={e => setClubQuery(e.target.value)} placeholder="Search clubs..." />
          <Button variant="secondary" size="sm" onClick={loadClubs}><RefreshCcw size={13} /></Button>
        </div>
        <Button variant="primary" onClick={openCreateClub}><Plus size={14} /> New Club</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {clubs.length === 0 ? (
          <EmptyState icon={Building2} title="No clubs found" description="There are no clubs matching your query." />
        ) : clubs.map(club => (
          <div key={club._id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong>{club.name}</strong>
              <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', wordBreak: 'break-word' }}>
                {club.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
              <Button variant="secondary" size="sm" onClick={() => openEditClub(club)}><Pencil size={13} /></Button>
              <Button variant="danger" size="sm" onClick={() => deleteClub(club)}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
      {showClubForm && renderClubForm()}
    </div>
  );

  const renderCommunityForm = () => (
    <Modal onClose={() => setShowCommunityForm(false)}>
      <div style={{ padding: 'var(--space-5)', minWidth: 360 }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{editingCommunity ? 'Edit Community' : 'Create Community'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Community Name"
            value={communityForm.name}
            onChange={e => setCommunityForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. CSE'28"
          />
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Type</label>
            <select
              value={communityForm.type}
              onChange={e => setCommunityForm(f => ({ ...f, type: e.target.value }))}
              disabled={!!editingCommunity}
              style={{
                width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', fontFamily: 'inherit',
              }}
            >
              <option value="batch">Batch</option>
              <option value="dept">Department</option>
              <option value="general">General</option>
              <option value="topic">Topic</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={communityForm.description}
              onChange={e => setCommunityForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe this community"
              rows={2}
              style={{
                width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setShowCommunityForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveCommunity}>{editingCommunity ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );

  const renderCommunities = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, maxWidth: 400 }}>
          <Input value={communityQuery} onChange={e => setCommunityQuery(e.target.value)} placeholder="Search communities..." />
          <Button variant="secondary" size="sm" onClick={loadCommunities}><RefreshCcw size={13} /></Button>
        </div>
        <Button variant="primary" onClick={openCreateCommunity}><Plus size={14} /> New Community</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {communities.length === 0 ? (
          <EmptyState icon={Users2} title="No communities found" description="There are no communities matching your query." />
        ) : communities.map(comm => (
          <div key={comm._id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>{comm.name}</strong>
                <Badge>{comm.type}</Badge>
              </div>
              <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {comm.description || 'No description'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
              <Button variant="secondary" size="sm" onClick={() => openEditCommunity(comm)}><Pencil size={13} /></Button>
              <Button variant="danger" size="sm" onClick={() => deleteCommunity(comm)}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
      {showCommunityForm && renderCommunityForm()}
    </div>
  );

  const renderResources = () => (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        <Input value={resourceQuery} onChange={e => setResourceQuery(e.target.value)} placeholder="Search by title, course code, or tags..." />
        <Button variant="secondary" size="sm" onClick={loadResources}><RefreshCcw size={13} /></Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {resourcesLoading ? (
          <Spinner text="Loading resources..." />
        ) : resources.length === 0 ? (
          <EmptyState icon={BookOpen} title="No resources found" description="There are no resources matching your query." />
        ) : resources.map(res => (
          <div key={res._id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{res.title}</strong>
                <Badge variant="info">{res.courseCode}</Badge>
                <Badge variant="secondary">Sem {res.semester}</Badge>
              </div>
              {res.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {res.tags.map(t => <Badge key={t} size="sm">{t}</Badge>)}
                </div>
              )}
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                by {res.uploaderId?.name || res.uploaderId?.email || 'Unknown'}
                · {new Date(res.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => deleteResource(res)} style={{ flexShrink: 0 }}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        <Input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search by name, email, or username..." />
        <Button variant="secondary" size="sm" onClick={loadUsers}><RefreshCcw size={13} /></Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {usersLoading ? (
          <Spinner text="Loading users..." />
        ) : adminUsers.length === 0 ? (
          <EmptyState icon={UserPlus} title="No users found" description="There are no users matching your query." />
        ) : adminUsers.map(u => (
          <div key={u._id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{u.name || 'Unnamed'}</strong>
                {u.isApproved === false ? (
                  <Badge variant="warning" size="sm">Pending</Badge>
                ) : (
                  <Badge variant="success" size="sm">Approved</Badge>
                )}
                <Badge variant={u.role === 'platform_admin' ? 'danger' : 'secondary'} size="sm">{u.role}</Badge>
                {u.dept && <Badge variant="info" size="sm">{u.dept}</Badge>}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {u.email} · {u.handle && `@${u.handle}`} · Joined {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, alignItems: 'center' }}>
              {u.isApproved === false && (
                <Button variant="primary" size="sm" onClick={() => approveUser(u._id)}>
                  <CheckCircle size={13} /> Approve
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => deleteAdminUser(u)}>
                <Trash2 size={13} /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        <Input value={activityQuery} onChange={e => setActivityQuery(e.target.value)} placeholder="Search by action, resource, or user..." />
        <Button variant="secondary" size="sm" onClick={loadActivity}><RefreshCcw size={13} /></Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {activityLoading ? (
          <Spinner text="Loading activity log..." />
        ) : activityLogs.length === 0 ? (
          <EmptyState icon={History} title="No activity recorded" description="No activity logs are available at this time." />
        ) : activityLogs.map(log => (
          <div key={log._id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0,
              background: log.action === 'delete' ? 'var(--danger-bg, rgba(239,68,68,0.1))' :
                log.action === 'create' ? 'var(--success-bg, rgba(34,197,94,0.1))' :
                  log.action === 'report' ? 'var(--warning-bg, rgba(234,179,8,0.1))' :
                    'var(--bg-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              color: log.action === 'delete' ? 'var(--danger)' :
                log.action === 'create' ? 'var(--success)' :
                  log.action === 'report' ? 'var(--warning)' :
                    'var(--text-secondary)',
            }}>
              {log.action === 'create' ? '+' : log.action === 'delete' ? '×' : log.action === 'update' ? '~' : '•'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{log.userName}</strong>
                <Badge variant="secondary" size="sm">{log.action}</Badge>
                <Badge variant="info" size="sm">{log.resource}</Badge>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {log.description}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {JSON.stringify(log.details).slice(0, 120)}
                </p>
              )}
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        <Input value={postQuery} onChange={e => setPostQuery(e.target.value)} placeholder="Search post content..." />
        <Button variant="secondary" size="sm" onClick={loadPosts}><RefreshCcw size={13} /></Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {posts.length === 0 ? (
          <EmptyState icon={FileText} title="No posts found" description="There are no posts matching your query." />
        ) : posts.map(post => (
          <div key={post._id} style={{
            display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)',
            padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Badge>{post.isHidden ? 'Hidden' : 'Visible'}</Badge>
                {post.communityId && <Badge variant="secondary">{post.communityId.name}</Badge>}
                {post.clubId && <Badge variant="secondary">{post.clubId.name}</Badge>}
              </div>
              <p style={{ margin: '4px 0', wordBreak: 'break-word' }}>{post.content}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                by {post.authorId?.name || post.authorId?.email || 'Anonymous'} · {new Date(post.createdAt).toLocaleDateString()}
                · {post.comments?.length || 0} comments · {post.upvotes?.length || 0} upvotes
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => deletePost(post)} style={{ flexShrink: 0 }}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--space-2)' }}>System Admin</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Full platform management - seed data, content moderation, and platform oversight.
            </p>
          </div>
          <Button variant="secondary" onClick={() => {
            loadAdminData();
            if (activeTab === 'clubs') loadClubs();
            if (activeTab === 'communities') loadCommunities();
            if (activeTab === 'resources') loadResources();
            if (activeTab === 'users') loadUsers();
            if (activeTab === 'activity') loadActivity();
            if (activeTab === 'posts') loadPosts();
          }}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <TabButton
              key={tab}
              active={activeTab === tab}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              icon={tab === 'overview' ? ShieldAlert : tab === 'clubs' ? Building2 : tab === 'communities' ? Users2 : tab === 'resources' ? BookOpen : tab === 'users' ? UserPlus : tab === 'activity' ? History : FileText}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'clubs' && renderClubs()}
        {activeTab === 'communities' && renderCommunities()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'posts' && renderPosts()}
      </div>
    </div>
  );
};

export default AdminDashboard;
