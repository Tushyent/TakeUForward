import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Users, BookOpen, MessageSquareWarning, UserCheck,
  RefreshCcw, Trash2, Plus, Pencil, Building2, Users2, Layers,
  FileText
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const TABS = ['overview', 'clubs', 'communities', 'posts'];

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

const StatCard = ({ icon: Icon, label, value, variant = 'primary' }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-input)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
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
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clubs state
  const [clubs, setClubs] = useState([]);
  const [clubQuery, setClubQuery] = useState('');
  const [showClubForm, setShowClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({ name: '', description: '' });

  // Communities state
  const [communities, setCommunities] = useState([]);
  const [communityQuery, setCommunityQuery] = useState('');
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [communityForm, setCommunityForm] = useState({ name: '', type: 'batch', description: '' });

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postQuery, setPostQuery] = useState('');

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
  }, [clubQuery]);

  const loadCommunities = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/admin/communities?${new URLSearchParams({ q: communityQuery, limit: '50' })}`);
      setCommunities(res.data.communities);
    } catch {
      toast.error('Failed to load communities');
    }
  }, [communityQuery]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/admin/posts?${new URLSearchParams({ q: postQuery, limit: '20' })}`);
      setPosts(res.data.posts);
    } catch {
      toast.error('Failed to load posts');
    }
  }, [postQuery]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);
  useEffect(() => { if (activeTab === 'clubs') loadClubs(); }, [activeTab, loadClubs]);
  useEffect(() => { if (activeTab === 'communities') loadCommunities(); }, [activeTab, loadCommunities]);
  useEffect(() => { if (activeTab === 'posts') loadPosts(); }, [activeTab, loadPosts]);

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

  if (loading && !overview && activeTab === 'overview') {
    return <Spinner text="Loading admin dashboard..." />;
  }

  const renderOverview = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
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
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>No clubs found.</p>
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
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>No communities found.</p>
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

  const renderPosts = () => (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
        <Input value={postQuery} onChange={e => setPostQuery(e.target.value)} placeholder="Search post content..." />
        <Button variant="secondary" size="sm" onClick={loadPosts}><RefreshCcw size={13} /></Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {posts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>No posts found.</p>
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
              Full platform management — seed data, content moderation, and platform oversight.
            </p>
          </div>
          <Button variant="secondary" onClick={() => {
            loadAdminData();
            if (activeTab === 'clubs') loadClubs();
            if (activeTab === 'communities') loadCommunities();
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
              icon={tab === 'overview' ? ShieldAlert : tab === 'clubs' ? Building2 : tab === 'communities' ? Users2 : FileText}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'clubs' && renderClubs()}
        {activeTab === 'communities' && renderCommunities()}
        {activeTab === 'posts' && renderPosts()}
      </div>
    </div>
  );
};

export default AdminDashboard;
