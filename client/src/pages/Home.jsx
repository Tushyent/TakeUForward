import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Users, BookOpen, ShieldAlert,
  ArrowRight, ChevronRight, Hash, Link2, MessageSquare,
  Briefcase, GraduationCap, FileText, Map, Star, Lightbulb,
  UserCheck, Package, ShoppingBag, Settings, Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD CATEGORIES — each with its own color identity
   ═══════════════════════════════════════════════════════════════════ */
const ACADEMIC_LINKS = [
  {
    to: '/resources', icon: BookOpen, label: 'Resources', desc: 'Notes & past papers',
    color: '#38BDF8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.22)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.04) 100%)',
  },
  {
    to: '/electives', icon: Lightbulb, label: 'Electives', desc: 'Course insights',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%)',
  },
  {
    to: '/reviews', icon: Star, label: 'Reviews', desc: 'Professors & courses',
    color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.04) 100%)',
  },
];

const CAREER_LINKS = [
  {
    to: '/mock-interviews', icon: MessageSquare, label: 'Mock Interviews', desc: 'Practice with peers',
    color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.16) 0%, rgba(167,139,250,0.04) 100%)',
  },
  {
    to: '/referrals', icon: Briefcase, label: 'Referrals', desc: 'Get referred fast',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%)',
  },
  {
    to: '/alumni', icon: GraduationCap, label: 'Alumni', desc: 'Network & connect',
    color: '#38BDF8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.22)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.04) 100%)',
  },
  {
    to: '/interview-experiences', icon: FileText, label: 'Experiences', desc: 'Real interview stories',
    color: '#FB7185', bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.22)',
    gradient: 'linear-gradient(135deg, rgba(251,113,133,0.14) 0%, rgba(251,113,133,0.04) 100%)',
  },
  {
    to: '/career-roadmaps', icon: Map, label: 'Roadmaps', desc: 'Guided paths',
    color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.04) 100%)',
  },
];

const CAMPUS_LINKS = [
  {
    to: '/clubs', icon: Users, label: 'Clubs', desc: 'Join campus clubs',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%)',
  },
  {
    to: '/team-finder', icon: UserCheck, label: 'Team Finder', desc: 'Hackathon teammates',
    color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.04) 100%)',
  },
  {
    to: '/lost-found', icon: Package, label: 'Lost & Found', desc: 'Report & find items',
    color: '#38BDF8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.22)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.04) 100%)',
  },
  {
    to: '/marketplace', icon: ShoppingBag, label: 'Marketplace', desc: 'Buy & sell campus stuff',
    color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.16) 0%, rgba(167,139,250,0.04) 100%)',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ icon: Icon, label, iconColor, accent }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 'var(--space-4)',
  }}>
    <div style={{
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-sm)',
      background: accent,
      border: `1px solid ${iconColor}35`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={15} color={iconColor} strokeWidth={2} />
    </div>
    <h3 style={{
      margin: 0,
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--text-primary)',
      letterSpacing: '-0.02em',
    }}>{label}</h3>
    <div style={{
      flex: 1,
      height: 1,
      background: 'linear-gradient(90deg, var(--border-strong) 0%, transparent 80%)',
      marginLeft: 4,
    }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM GRID CARD
   ═══════════════════════════════════════════════════════════════════ */
const GridCard = ({ to, icon: Icon, label, desc, color, bg, border, gradient }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          padding: '20px 18px 18px',
          borderRadius: 'var(--radius-lg)',
          background: hovered
            ? gradient
            : 'rgba(22, 22, 28, 0.80)',
          border: `1px solid ${hovered ? border : 'rgba(255,255,255,0.06)'}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: hovered
            ? `0 8px 28px rgba(0,0,0,0.30), 0 0 0 1px ${border}, inset 0 1px 0 rgba(255,255,255,0.08)`
            : '0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.04)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
          height: '100%',
          minHeight: 126,
        }}
      >
        {/* Top-right corner glow blob */}
        <div style={{
          position: 'absolute',
          top: -12,
          right: -12,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `${color}14`,
          filter: 'blur(16px)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: 'none',
        }} />

        {/* Icon */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: bg,
          border: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
        }}>
          <Icon size={18} color={color} strokeWidth={1.75} />
        </div>

        <div>
          <p style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: hovered ? 'white' : 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            transition: 'color 150ms ease',
          }}>
            {label}
          </p>
          <p style={{
            margin: '3px 0 0',
            fontSize: 'var(--text-xs)',
            color: hovered ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)',
            lineHeight: 1.4,
            transition: 'color 150ms ease',
          }}>
            {desc}
          </p>
        </div>

        {/* Bottom arrow — shows on hover */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'all 150ms ease',
          color,
        }}>
          <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION GRID
   ═══════════════════════════════════════════════════════════════════ */
const renderGrid = (title, items, icon, iconColor, accent) => (
  <div style={{ marginBottom: 'var(--space-8)' }}>
    <SectionHeader icon={icon} label={title} iconColor={iconColor} accent={accent} />
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
      gap: 'var(--space-3)',
    }}>
      {items.map(item => (
        <GridCard key={item.label} {...item} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   COMMUNITY TYPE HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const communityVariant = (type) => {
  const map = { dept: 'primary', batch: 'info', general: 'success', topic: 'accent' };
  return map[type] || 'secondary';
};
const communityAccent = (type) => {
  const map = { dept: 'var(--primary)', batch: 'var(--info)', general: 'var(--success)', topic: 'var(--accent)' };
  return map[type] || 'var(--text-muted)';
};

/* ═══════════════════════════════════════════════════════════════════
   INITIALS AVATAR
   ═══════════════════════════════════════════════════════════════════ */
const InitialsAvatar = ({ name, size = 52 }) => {
  const initials = (name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.36, fontWeight: 700,
      letterSpacing: '-0.02em', flexShrink: 0,
      boxShadow: '0 0 0 3px rgba(99,102,241,0.30)',
    }}>
      {initials}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HERO GREETING CARD
   ═══════════════════════════════════════════════════════════════════ */
const HeroCard = ({ user, navigate }) => {
  const [hovered, setHovered] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      onClick={() => navigate('/settings/profile')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        background: 'linear-gradient(135deg, #0F0F1A 0%, #12121E 40%, #0A0A12 100%)',
        border: '1px solid rgba(99,102,241,0.28)',
        boxShadow: hovered
          ? '0 0 0 1px rgba(99,102,241,0.35), 0 20px 60px rgba(99,102,241,0.12)'
          : '0 4px 24px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 300ms ease, border-color 300ms ease',
      }}
    >
      {/* Gradient mesh blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 60% at 80% -10%, rgba(99,102,241,0.22) 0%, transparent 65%),
          radial-gradient(ellipse 40% 35% at 5% 100%, rgba(245,158,11,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 35% 30% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)
        `,
      }} />

      {/* Subtle grid lines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                referrerPolicy="no-referrer"
                style={{
                  width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                  border: '2.5px solid rgba(99,102,241,0.60)',
                  boxShadow: '0 0 0 4px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.25)',
                }}
              />
            ) : (
              <InitialsAvatar name={user?.name} size={56} />
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: '0 0 2px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'rgba(165,180,252,0.70)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>{greeting} ·</p>

            <h1 style={{
              margin: 0,
              fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #F0F0F8 0%, #C4B5FD 55%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Badge variant={user?.isPlatformAdmin ? 'danger' : user?.role === 'alumni' ? 'accent' : 'primary'}>
                {user?.role?.replace('_', ' ')}
              </Badge>
              {user?.dept && <Badge variant="secondary">{user.dept}</Badge>}
              {user?.year && <Badge variant="secondary">Class of {user.year}</Badge>}
              {user?.currentCompany && <Badge variant="success">{user.currentCompany}</Badge>}
            </div>
          </div>

          {/* Profile CTA chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.28)',
            color: '#A5B4FC',
            fontSize: '0.72rem',
            fontWeight: 600,
            flexShrink: 0,
            transition: 'background 150ms ease',
          }}>
            <Settings size={11} />
            Edit Profile
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          marginTop: 'var(--space-5)',
          marginBottom: 0,
          color: 'rgba(168,168,200,0.75)',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.7,
          maxWidth: 560,
        }}>
          Your SSN campus platform — academics, placements, alumni, and everything campus.{' '}
          <span style={{ color: '#A5B4FC', fontWeight: 500 }}>Explore below →</span>
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════════════ */
function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axiosClient.get('/communities');
        const all = response.data;
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
        // silently fail — communities are supplementary on home
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
      const response = await axiosClient.post('/admin/marketing-email', { email: inviteEmail });
      toast.success(response.data.message || 'Email sent successfully!');
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-transition">
        <div className="page-col page-col-wide">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide">

        {/* ── HERO ── */}
        <HeroCard user={user} navigate={navigate} />

        {/* ── ADMIN: MODERATION QUEUE ── */}
        {user?.isPlatformAdmin && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244,63,94,0.07)',
            border: '1px solid rgba(244,63,94,0.28)',
            marginBottom: 'var(--space-6)',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldAlert size={16} color="var(--danger)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--danger)' }}>Moderation Queue</p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Review flagged and reported posts</p>
              </div>
            </div>
            <Link to="/moderation" style={{ textDecoration: 'none' }}>
              <Button variant="danger" size="sm">Open Dashboard <ArrowRight size={13} /></Button>
            </Link>
          </div>
        )}

        {/* ── ADMIN: STUDENT WELCOME EMAIL ── */}
        {user?.isPlatformAdmin && (
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={16} color="var(--primary)" /> Send Welcome Email to Student
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Input type="email" placeholder="Student email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <Button onClick={handleSendStudentWelcome} disabled={isSubmitting} style={{ flexShrink: 0 }}>
                {isSubmitting ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </Card>
        )}

        {/* ── DASHBOARD GRIDS ── */}
        {renderGrid('Academics', ACADEMIC_LINKS, BookOpen, '#38BDF8', 'rgba(56,189,248,0.12)')}
        {renderGrid('Career & Placements', CAREER_LINKS, Briefcase, '#F59E0B', 'rgba(245,158,11,0.12)')}
        {renderGrid('Campus Life', CAMPUS_LINKS, Users, '#10B981', 'rgba(16,185,129,0.12)')}

        {/* ── FEEDBACK CTA ── */}
        <div style={{
          position: 'relative',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #0F0F1A 0%, #0D0D18 100%)',
          border: '1px solid rgba(99,102,241,0.28)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          marginBottom: 'var(--space-8)',
          overflow: 'hidden',
          textAlign: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-4)',
            }}>
              <Sparkles size={22} color="#A5B4FC" />
            </div>
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              We need your support! 🙌
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '0 auto var(--space-5)', maxWidth: 480, lineHeight: 1.7 }}>
              TakeUForward is built by students like you. Spot a bug, have an idea? Share it — every bit of feedback shapes this platform.
            </p>
            <Link to="/support" style={{ textDecoration: 'none' }}>
              <Button variant="primary" className="btn-lg">Share Feedback</Button>
            </Link>
          </div>
        </div>

        {/* ── COMMUNITIES ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hash size={15} color="var(--primary)" />
              <h3 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 700 }}>Your Communities</h3>
            </div>
            <Badge variant="secondary">{communities.length} total</Badge>
          </div>

          {communities.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No communities yet"
              message="This is a community-driven platform. Join or create a community to get started."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {communities.map(comm => {
                const accent = communityAccent(comm.type);
                return (
                  <Link key={comm._id} to={`/community/${comm._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'background 0.18s ease, border-color 0.18s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                          background: `${accent}18`, border: `1px solid ${accent}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Hash size={13} color={accent} />
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
