import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, BookOpen, Users, Briefcase, GraduationCap, MessageSquare, Star } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';

/* ----------------------------------------------------------------
   GOOGLE SIGN-IN "G" MARK
   ---------------------------------------------------------------- */
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/* ----------------------------------------------------------------
   BRAND MARK SVG
   ---------------------------------------------------------------- */
const BrandMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2" y="4" width="8" height="16" rx="2.5" fill="white" fillOpacity="0.95" />
    <rect x="14" y="10" width="8" height="10" rx="2.5" fill="white" fillOpacity="0.65" />
    <circle cx="18" cy="6" r="2.5" fill="white" fillOpacity="0.90" />
  </svg>
);

/* ----------------------------------------------------------------
   FEATURE CARDS on branding panel
   ---------------------------------------------------------------- */
const FEATURES = [
  {
    icon: BookOpen,
    title: 'Academic Resources',
    desc: 'Notes, PYQs, electives & professor reviews',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.10)',
    border: 'rgba(56,189,248,0.20)',
  },
  {
    icon: Users,
    title: 'Campus Communities',
    desc: 'Dept. & batch groups with real discussions',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.20)',
  },
  {
    icon: Briefcase,
    title: 'Career & Referrals',
    desc: 'Alumni network, referrals & mock interviews',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.20)',
  },
  {
    icon: GraduationCap,
    title: 'Alumni Mentorship',
    desc: 'Connect with SSN alumni at top companies',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.20)',
  },
];

/* ----------------------------------------------------------------
   FLOATING ICON DECORATIONS
   ---------------------------------------------------------------- */
const FloatingIcon = ({ icon: Icon, size, color, style }) => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${color}18`,
      border: `1px solid ${color}28`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'float 4s ease-in-out infinite',
      backdropFilter: 'blur(4px)',
      ...style,
    }}
  >
    <Icon size={size * 0.45} color={color} strokeWidth={1.5} />
  </div>
);

/* ----------------------------------------------------------------
   MAIN COMPONENT
   ---------------------------------------------------------------- */
function Login() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get('error');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showAlumniForm, setShowAlumniForm] = useState(false);
  const [alumniFormData, setAlumniFormData] = useState({
    name: '', email: '', dept: '', graduationYear: '',
    currentCompany: '', proofLink: '', message: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (errorParam) {
      toast.error(`Login failed: ${decodeURIComponent(errorParam)}`);
      navigate('/login', { replace: true });
    }
  }, [errorParam, navigate]);

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await axiosClient.post('/auth/alumni/request', alumniFormData);
      toast.success('Request submitted! Admins will review it soon.');
      setShowAlumniForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleLogin = () => {
    setLoading(true);
    const isDeployed = window.location.hostname !== 'localhost';
    const rawUrl = import.meta.env.VITE_API_URL;
    const apiUrl = (
      isDeployed && rawUrl && rawUrl.includes('.onrender.com')
        ? '/api'
        : (rawUrl || '/api')
    ).replace(/\/+$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="login-root page-transition">

      {/* ── LEFT: BRANDING PANEL ── */}
      <div className="login-branding-panel">

        {/* Floating campus icons */}
        <FloatingIcon icon={Star} size={52} color="#F59E0B" style={{ top: '12%', right: '18%', animationDelay: '0s' }} />
        <FloatingIcon icon={MessageSquare} size={44} color="#6366F1" style={{ top: '30%', left: '8%', animationDelay: '1.2s' }} />
        <FloatingIcon icon={GraduationCap} size={60} color="#10B981" style={{ bottom: '22%', right: '10%', animationDelay: '0.7s' }} />
        <FloatingIcon icon={BookOpen} size={40} color="#38BDF8" style={{ bottom: '14%', left: '16%', animationDelay: '2s' }} />
        <FloatingIcon icon={Users} size={48} color="#A78BFA" style={{ top: '8%', left: '25%', animationDelay: '1.5s' }} />

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 460, width: '100%' }}>

          {/* Logo + wordmark */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 'var(--space-8)',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 28px rgba(99,102,241,0.50)',
              flexShrink: 0,
            }}>
              <BrandMark size={30} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                margin: 0,
                fontSize: 'var(--text-3xl)',
                fontWeight: 800,
                letterSpacing: '-0.05em',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #F0F0F5 0%, #C4B5FD 50%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                TakeUForward
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                SSN College of Engineering
              </p>
            </div>
          </div>

          {/* Headline */}
          <p style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-3)',
            lineHeight: 1.3,
            fontFamily: 'var(--font-sans)',
          }}>
            Your campus, all in one place.
          </p>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-10)',
            maxWidth: 380,
            margin: '0 auto var(--space-10)',
          }}>
            Academics, placements, alumni mentorship, and campus life — built exclusively for SSN.
          </p>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', textAlign: 'left' }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div key={title} style={{
                padding: 'var(--space-4)',
                background: bg,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${border}`,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                transition: 'transform 0.2s ease',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: `${color}22`,
                  border: `1px solid ${color}35`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={16} color={color} strokeWidth={2} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {title}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: FORM PANEL ── */}
      <div className="login-form-panel">
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile-only brand */}
          <div
            className="login-mobile-brand"
            style={{ alignItems: 'center', gap: 12, marginBottom: 'var(--space-10)' }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(99,102,241,0.45)',
            }}>
              <BrandMark size={22} />
            </div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontFamily: 'var(--font-sans)' }}>
              TakeUForward
            </span>
          </div>

          {/* Heading */}
          {!showAlumniForm && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-sans)',
              }}>
                Welcome back 👋
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Sign in with your official SSN College email to continue.
              </p>
            </div>
          )}

          {showAlumniForm ? (
            /* ── Alumni request form ── */
            <div>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.04em',
                  marginBottom: 'var(--space-1)',
                  fontFamily: 'var(--font-sans)',
                }}>
                  Alumni Access Request
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Submit your details and admins will send you an invite link.
                </p>
              </div>
              <form onSubmit={handleAlumniSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Input placeholder="Full Name" required value={alumniFormData.name} onChange={e => setAlumniFormData({...alumniFormData, name: e.target.value})} />
                <Input type="email" placeholder="Email Address" required value={alumniFormData.email} onChange={e => setAlumniFormData({...alumniFormData, email: e.target.value})} />
                <Input placeholder="Department (e.g. CSE)" required value={alumniFormData.dept} onChange={e => setAlumniFormData({...alumniFormData, dept: e.target.value})} />
                <Input type="number" placeholder="Graduation Year (e.g. 2020)" required value={alumniFormData.graduationYear} onChange={e => setAlumniFormData({...alumniFormData, graduationYear: e.target.value})} />
                <Input placeholder="Current Company / University" value={alumniFormData.currentCompany} onChange={e => setAlumniFormData({...alumniFormData, currentCompany: e.target.value})} />
                <Input placeholder="LinkedIn / Proof Link" required value={alumniFormData.proofLink} onChange={e => setAlumniFormData({...alumniFormData, proofLink: e.target.value})} />
                <Textarea placeholder="Optional message to admins..." value={alumniFormData.message} onChange={e => setAlumniFormData({...alumniFormData, message: e.target.value})} />
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Button type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setShowAlumniForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={submittingRequest}>
                    {submittingRequest ? 'Submitting…' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Google sign-in button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                id="google-signin-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-3)',
                  padding: '13px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease',
                  position: 'relative',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.20)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, flexShrink: 0 }} />
                    Redirecting to Google…
                  </>
                ) : (
                  <>
                    <GoogleMark />
                    Continue with Google
                    <ArrowRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                  </>
                )}
              </button>

              {/* Divider + info */}
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.18)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
                    🔒 Only <strong style={{ color: 'var(--text-secondary)' }}>@ssn.edu.in</strong> addresses are accepted for student login.
                  </p>
                </div>

                <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  SSN alumni without an invite?{' '}
                  <button
                    type="button"
                    onClick={() => setShowAlumniForm(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#A5B4FC',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      textDecoration: 'underline',
                      textDecorationColor: 'rgba(165,180,252,0.40)',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    Request Access →
                  </button>
                </p>
              </div>

              {/* Mobile feature list */}
              <div
                className="login-mobile-features"
                style={{ flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-10)' }}
              >
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase', margin: 0 }}>
                  Platform Features
                </p>
                {FEATURES.map(({ icon: Icon, title, color, bg, border }) => (
                  <div key={title} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: bg,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${border}`,
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-xs)',
                      background: `${color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} color={color} />
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
