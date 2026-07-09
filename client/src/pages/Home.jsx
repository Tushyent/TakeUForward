import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  Users, BookOpen, ShieldAlert,
  ArrowRight, ChevronRight, Hash, Link2, MessageSquare, Briefcase, GraduationCap, FileText, Map, Star, Lightbulb, UserCheck, Package, ShoppingBag
} from 'lucide-react';

/* ---------------------------------------------------------------
   DASHBOARD CATEGORIES
   --------------------------------------------------------------- */
const ACADEMIC_LINKS = [
  { to: '/resources', icon: BookOpen, label: 'Resources', desc: 'Notes & materials', color: '#60A5FA', glow: 'rgba(96,165,250,0.2)' },
  { to: '/electives', icon: Lightbulb, label: 'Electives', desc: 'Course insights', color: '#FBBF24', glow: 'rgba(251,191,36,0.2)' },
  { to: '/reviews', icon: Star, label: 'Reviews', desc: 'Professors & courses', color: '#34D399', glow: 'rgba(52,211,153,0.2)' },
];

const CAREER_LINKS = [
  { to: '/mock-interviews', icon: MessageSquare, label: 'Mock Interviews', desc: 'Practice with peers', color: '#7C6AF7', glow: 'rgba(124,106,247,0.2)' },
  { to: '/referrals', icon: Briefcase, label: 'Referrals', desc: 'Get referred', color: '#F97316', glow: 'rgba(249,115,22,0.2)' },
  { to: '/alumni', icon: GraduationCap, label: 'Alumni', desc: 'Network & connect', color: '#60A5FA', glow: 'rgba(96,165,250,0.2)' },
  { to: '/interview-experiences', icon: FileText, label: 'Experiences', desc: 'Read past stories', color: '#FBBF24', glow: 'rgba(251,191,36,0.2)' },
  { to: '/career-roadmaps', icon: Map, label: 'Roadmaps', desc: 'Guided paths', color: '#34D399', glow: 'rgba(52,211,153,0.2)' },
];

const CAMPUS_LINKS = [
  { to: '/clubs', icon: Users, label: 'Clubs', desc: 'Join communities', color: '#F97316', glow: 'rgba(249,115,22,0.2)' },
  { to: '/team-finder', icon: UserCheck, label: 'Team Finder', desc: 'Find hackathon mates', color: '#34D399', glow: 'rgba(52,211,153,0.2)' },
  { to: '/lost-found', icon: Package, label: 'Lost & Found', desc: 'Report & find', color: '#60A5FA', glow: 'rgba(96,165,250,0.2)' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace', desc: 'Buy & sell', color: '#7C6AF7', glow: 'rgba(124,106,247,0.2)' },
];

const renderGrid = (title, items, icon) => (
  <div style={{ marginBottom: 'var(--space-8)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
      {icon}
      <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{title}</h3>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 'var(--space-4)',
    }}>
      {items.map(({ to, icon: Icon, label, desc, color, glow }) => (
        <Link key={to} to={to} style={{ textDecoration: 'none' }}>
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              transition: 'box-shadow var(--transition-base), transform var(--transition-base), border-color var(--transition-base)',
              cursor: 'pointer',
              height: '100%'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 0 0 1px ${glow}, 0 8px 24px rgba(0,0,0,0.4)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = color + '55';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: glow,
              border: `1px solid ${color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-3)',
            }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              {label}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              {desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

/* ---------------------------------------------------------------
   COMMUNITY TYPE BADGE VARIANT MAP
   --------------------------------------------------------------- */
const communityVariant = (type) => {
  const map = { dept: 'primary', batch: 'info', general: 'success', topic: 'accent' };
  return map[type] || 'secondary';
};

/* ---------------------------------------------------------------
   INITIALS AVATAR — fallback for users without a picture
   --------------------------------------------------------------- */
const InitialsAvatar = ({ name, size = 44 }) => {
  const initials = (name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: size * 0.38,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

/* ---------------------------------------------------------------
   HOME PAGE
   --------------------------------------------------------------- */
function Home() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Alumni invite (admin only)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axiosClient.get('/communities');
        setCommunities(response.data);
      } catch {
        // silently fail — communities are supplementary on home
      }
    };
    fetchCommunities();
  }, []);

  const handleGenerateInvite = async () => {
    if (!inviteEmail) { toast.error('Please enter an email'); return; }
    setInviteLink('');
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/alumni/invite', {
        email: inviteEmail,
        currentCompany: 'Test Company',
      });
      setInviteLink(response.data.inviteLink);
      toast.success('Invite generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="page-transition">
                <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  /* ---------- Full page ---------- */
  return (
    <div className="page-transition">
      
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>

        {/* ── HERO GREETING CARD ── */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-6)',
          background: 'linear-gradient(135deg, #1a1536 0%, #161720 60%, #0f1420 100%)',
          border: '1px solid rgba(124,106,247,0.25)',
          boxShadow: '0 0 40px rgba(124,106,247,0.10)',
          overflow: 'hidden',
        }}>
          {/* Decorative gradient blob */}
          <div style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,247,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -40,
            left: 80,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', border: '2px solid var(--primary)', objectFit: 'cover' }}
                />
              ) : (
                <InitialsAvatar name={user?.name} size={52} />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>
                    Hey, {user?.name?.split(' ')[0] || 'there'} 👋
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Badge variant={user?.role === 'alumni' ? 'accent' : user?.role === 'platform_admin' ? 'danger' : 'primary'}>
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                  {user?.dept && <Badge variant="secondary">{user.dept}</Badge>}
                  {user?.year && <Badge variant="secondary">Class of {user.year}</Badge>}
                  {user?.currentCompany && <Badge variant="success">{user.currentCompany}</Badge>}
                </div>
              </div>
            </div>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              margin: 0,
              lineHeight: 1.7,
            }}>
              Welcome back to <strong style={{ color: 'var(--text-primary)' }}>TakeUForward</strong> — your campus community for academics, placements, and everything in between.
            </p>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
                ⚠ {error}
              </p>
            )}
          </div>
        </div>

        {/* ── MODERATION QUEUE (admin only) ── */}
        {user?.isPlatformAdmin && (
          <Card
            style={{
              background: 'var(--danger-bg)',
              borderColor: 'rgba(248,113,113,0.35)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShieldAlert size={18} color="var(--danger)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', margin: 0, color: 'var(--danger)' }}>Moderation Queue</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Review flagged and reported posts</p>
                </div>
              </div>
              <Link to="/moderation" style={{ textDecoration: 'none' }}>
                <Button variant="danger" size="sm">
                  Open Dashboard <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* ── ALUMNI INVITE (platform admin only) ── */}
        {user?.role === 'platform_admin' && (
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={16} color="var(--primary)" />
              Generate Alumni Invite
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Input
                type="email"
                placeholder="Alumnus email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <Button
                onClick={handleGenerateInvite}
                disabled={isSubmitting}
                style={{ flexShrink: 0 }}
              >
                {isSubmitting ? 'Generating…' : 'Generate'}
              </Button>
            </div>
            {inviteLink && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                wordBreak: 'break-all',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Invite link:</span>
                <a href={inviteLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{inviteLink}</a>
              </div>
            )}
          </Card>
        )}

        {/* ── DASHBOARD GRIDS ── */}
        {renderGrid('Academics', ACADEMIC_LINKS, <BookOpen size={16} color="var(--info)" />)}
        {renderGrid('Career & Placements', CAREER_LINKS, <Briefcase size={16} color="var(--accent)" />)}
        {renderGrid('Campus Life', CAMPUS_LINKS, <Users size={16} color="var(--success)" />)}

        {/* ── COMMUNITIES LIST ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hash size={15} color="var(--primary)" />
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Your Communities</h3>
            </div>
            <Badge variant="secondary">{communities.length} total</Badge>
          </div>

          {communities.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No communities yet"
              message="Communities will appear here once your department and batch are set up."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {communities.map(comm => (
                <Link
                  key={comm._id}
                  to={`/community/${comm._id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-input)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(124,106,247,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Hash size={14} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {comm.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {comm.memberCount} members
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Badge variant={communityVariant(comm.type)} size="sm">{comm.type}</Badge>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

export default Home;
