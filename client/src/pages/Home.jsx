import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/auth-context';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  Users, BookOpen, ShieldAlert, MessageCircle,
  ArrowRight, ChevronRight, Hash, Link2, MessageSquare, Briefcase, GraduationCap, FileText, Map, Star, Lightbulb, UserCheck, Package, ShoppingBag
} from 'lucide-react';

/* ---------------------------------------------------------------
   DASHBOARD CATEGORIES
   --------------------------------------------------------------- */
const ACADEMIC_LINKS = [
  { to: '/resources', icon: BookOpen, label: 'Resources', desc: 'Notes & materials', color: 'var(--info)', glow: 'var(--info-bg)' },
  { to: '/electives', icon: Lightbulb, label: 'Electives', desc: 'Course insights', color: 'var(--warning)', glow: 'var(--warning-bg)' },
  { to: '/reviews', icon: Star, label: 'Reviews', desc: 'Professors & courses', color: 'var(--success)', glow: 'var(--success-bg)' },
];

const CAREER_LINKS = [
  { to: '/mock-interviews', icon: MessageSquare, label: 'Mock Interviews', desc: 'Practice with peers', color: 'var(--primary)', glow: 'var(--primary-glow)' },
  { to: '/referrals', icon: Briefcase, label: 'Referrals', desc: 'Get referred', color: 'var(--accent)', glow: 'var(--accent-bg)' },
  { to: '/alumni', icon: GraduationCap, label: 'Alumni', desc: 'Network & connect', color: 'var(--info)', glow: 'var(--info-bg)' },
  { to: '/interview-experiences', icon: FileText, label: 'Experiences', desc: 'Read past stories', color: 'var(--warning)', glow: 'var(--warning-bg)' },
  { to: '/career-roadmaps', icon: Map, label: 'Roadmaps', desc: 'Guided paths', color: 'var(--success)', glow: 'var(--success-bg)' },
];

const CAMPUS_LINKS = [
  { to: '/clubs', icon: Users, label: 'Clubs', desc: 'Join communities', color: 'var(--accent)', glow: 'var(--accent-bg)' },
  { to: '/team-finder', icon: UserCheck, label: 'Team Finder', desc: 'Find hackathon mates', color: 'var(--success)', glow: 'var(--success-bg)' },
  { to: '/lost-found', icon: Package, label: 'Lost & Found', desc: 'Report & find', color: 'var(--info)', glow: 'var(--info-bg)' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace', desc: 'Buy & sell', color: 'var(--primary)', glow: 'var(--primary-glow)' },
];

const renderGrid = (title, items, icon) => (
  <div style={{ marginBottom: 'var(--space-8)' }}>
    <div style={{ marginBottom: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
    </div>
    <div className="dashboard-grid">
      {items.map(({ to, icon: Icon, label, desc, color }) => (
        <Link to={to} key={label} style={{ textDecoration: 'none' }}>
          <div
            className="dashboard-grid-card"
            style={{
              '--card-accent-color': color,
              '--card-accent-color-glow': `${color}1c`,
            }}
          >
            {/* Background color glow effect on card */}
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
              pointerEvents: 'none'
            }} />

            {/* Glowing Icon Capsule */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              background: `linear-gradient(135deg, ${color}1c 0%, ${color}04 100%)`,
              border: `1px solid ${color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-5)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s',
            }}
              className="grid-icon-glow"
            >
              <Icon size={22} color={color} />
            </div>
            
            <h4 style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 650, 
              color: 'var(--text-primary)', 
              margin: '0 0 6px 0',
              letterSpacing: '-0.01em'
            }}>
              {label}
            </h4>
            
            <p style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--text-secondary)', 
              margin: 0, 
              lineHeight: 1.45 
            }}>
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

const communityAccent = (type) => {
  const map = { dept: 'var(--primary)', batch: 'var(--info)', general: 'var(--success)', topic: 'var(--accent)' };
  return map[type] || 'var(--text-muted)';
};

const communityBg = (type) => {
  const map = { dept: 'var(--primary-glow)', batch: 'var(--info-bg)', general: 'var(--success-bg)', topic: 'var(--accent-bg)' };
  return map[type] || 'var(--bg-elevated)';
};

/* ---------------------------------------------------------------
   INITIALS AVATAR - fallback for users without a picture
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
      background: 'var(--primary)',
      border: '1.5px solid var(--border-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--primary-ink)',
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
  const [loading, setLoading] = useState(true);
  // Alumni invite (admin only)
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axiosClient.get('/communities');
        const all = response.data;
        // Filter to only show: user's dept+batch community, General, and Placements
        const deptToShort = {
          Mechanical: 'MECH', Chemical: 'CHEM', Biomedical: 'BIOMED', Civil: 'CIVIL',
          'MTECH-CSE': 'MTECH-CSE',
        };
        const relevant = all.filter(c => {
          if (c.name === 'General' || c.name === 'Placements') return true;
          if (user?.dept && user?.year) {
            const batchSuffix = String(user.year).slice(-2);
            const short = deptToShort[user.dept] || user.dept;
            if (c.name === `${short}'${batchSuffix}`) return true;
          }
          return false;
        });
        setCommunities(relevant);
      } catch {
        // silently fail - communities are supplementary on home
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [user]);

  const handleSendStudentWelcome = async () => {
    if (!inviteEmail) { toast.error('Please enter an email'); return; }
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/admin/marketing-email', {
        email: inviteEmail,
      });
      toast.success(response.data.message || 'Email sent successfully!');
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
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

        <div
          onClick={() => navigate('/settings/profile')}
          className="dashboard-welcome-card"
        >
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="dashboard-welcome-header">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border-strong)',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
              ) : (
                <InitialsAvatar name={user?.name} size={54} />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Hey, {user?.name?.split(' ')[0] || 'there'} 👋
                  </h1>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <Badge variant={user?.isPlatformAdmin ? 'danger' : user?.role === 'alumni' ? 'accent' : 'primary'}>
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                  {user?.dept && <Badge variant="secondary">{user.dept}</Badge>}
                  {user?.year && <Badge variant="secondary">{user.year}</Badge>}
                  {user?.currentCompany && <Badge variant="success">{user.currentCompany}</Badge>}
                </div>
              </div>
            </div>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Welcome back to <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>TakeUForward</strong> — your campus community for academics, placements, and everything in between.
            </p>
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

        {/* ── STUDENT WELCOME EMAIL (platform admin only) ── */}
        {user?.isPlatformAdmin && (
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={16} color="var(--primary)" />
              Send Welcome Email to Student
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Input
                type="email"
                placeholder="Student email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <Button
                onClick={handleSendStudentWelcome}
                disabled={isSubmitting}
                style={{ flexShrink: 0 }}
              >
                {isSubmitting ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </Card>
        )}

        {/* ── DASHBOARD GRIDS ── */}
        {renderGrid('Academics', ACADEMIC_LINKS, <BookOpen size={16} color="var(--info)" />)}
        {renderGrid('Career & Placements', CAREER_LINKS, <Briefcase size={16} color="var(--accent)" />)}
        {renderGrid('Campus Life', CAMPUS_LINKS, <Users size={16} color="var(--success)" />)}

        {/* ── FEEDBACK CTA ── */}
        <Card
          variant="highlight"
          style={{
            marginBottom: 'var(--space-6)',
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, transparent 100%)',
            border: '1px solid var(--primary)',
            textAlign: 'center',
            padding: 'var(--space-8)',
            transition: 'box-shadow 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 30px var(--primary-glow), 0 0 60px color-mix(in srgb, var(--primary) 10%, transparent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-glow)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}>
            <MessageCircle size={22} color="var(--primary)" />
          </div>
          <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)' }}>
            We need your support! 🙌
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            margin: '0 auto var(--space-5)',
            maxWidth: 480,
            lineHeight: 1.7,
          }}>
            TakeUForward SSN is built and improved by students like you. Spot a bug, have an idea,
            or just want to tell us what's missing? Share it with us - every bit of feedback helps
            us make this better for everyone.
          </p>
          <Link to="/support" style={{ textDecoration: 'none' }}>
            <Button variant="primary" className="btn-lg">Share Feedback</Button>
          </Link>
        </Card>

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
              title="No communities to show"
              message="This is a community-driven platform. Help us grow it by joining or creating a community."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {communities.map(comm => {
                const accent = communityAccent(comm.type);
                const bgg = communityBg(comm.type);
                return (
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
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${bgg}18`;
                        e.currentTarget.style.borderColor = `${accent}55`;
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}22`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-md)',
                          background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
                          border: `1px solid ${accent}33`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Hash size={15} color={accent} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {comm.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {comm.memberCount} member{comm.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Badge variant={communityVariant(comm.type)} size="sm">{comm.type}</Badge>
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

export default Home;
