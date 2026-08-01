import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, ArrowRight, BookOpen, Users, Briefcase } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { useSEO } from '../hooks/useSEO';

/* ---------------------------------------------------------------
   GOOGLE SIGN-IN SVG LOGO
   The standard Google "G" mark per Google Sign-In brand guidelines.
   --------------------------------------------------------------- */
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/* ---------------------------------------------------------------
   DECORATIVE BLOB - abstract background shape for branding panel
   --------------------------------------------------------------- */
const BlobDecoration = () => (
  <svg
    viewBox="0 0 400 400"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.06 }}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#7C6AF7" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <ellipse cx="200" cy="150" rx="220" ry="180" fill="url(#blob1)" />
    <ellipse cx="250" cy="280" rx="160" ry="140" fill="url(#blob2)" />
  </svg>
);

/* Feature pills shown on the branding panel */
const FEATURES = [
  { icon: BookOpen, text: 'Notes & PYQ resources' },
  { icon: Users, text: 'Dept. & batch communities' },
  { icon: Briefcase, text: 'Alumni referral network' },
];

function Login() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get('error');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useSEO({
    title: 'Sign In - TakeUForward SSN Campus Community',
    description: 'Sign in to TakeUForward SSN using your @ssn.edu.in account to access campus communities, alumni mentorship, placement notes, and referral requests.',
    keywords: 'SSN Login, TakeUForward Sign In, SSN Mentorship Login, Campus Community SSN',
    canonical: 'https://takeuforward.blastorz.fun/login'
  });

  const [showAlumniForm, setShowAlumniForm] = useState(false);
  const [alumniFormData, setAlumniFormData] = useState({
    name: '', email: '', dept: '', graduationYear: '',
    currentCompany: '', proofLink: '', message: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'domain') {
        toast.error('Login failed: Please use your official @ssn.edu.in email address, or submit an Alumni Verification request below.', { duration: 6000 });
      } else {
        toast.error(`Login failed: ${decodeURIComponent(errorParam)}`);
      }
      // Clean up the URL
      navigate('/login', { replace: true });
    }
  }, [errorParam, navigate]);

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await axiosClient.post('/auth/alumni/request', alumniFormData);
      toast.success('Request submitted successfully! Admins will review it soon.');
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

      {/* ── LEFT: BRANDING PANEL (desktop only) ── */}
      <div className="login-branding-panel">
        {/* Decorative background blobs */}
        <BlobDecoration />

        {/* Radial glow behind content */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brand mark */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 'var(--space-8)',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(124,106,247,0.5)',
            }}>
              <Zap size={26} color="white" fill="white" />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--text-3xl)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #EEEEF0 0%, #9585F9 60%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              TakeUForward
            </h1>
          </div>

          <p style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-3)',
            lineHeight: 1.3,
          }}>
            Your campus. Connected.
          </p>

          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-10)',
          }}>
            The all-in-one platform for SSN students - academics, placements, alumni mentorship, and campus community in one place.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'left' }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(124,106,247,0.07)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(124,106,247,0.15)',
              }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(124,106,247,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="var(--primary)" />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: FORM PANEL ── */}
      <div className="login-form-panel">
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile-only brand (shown when left panel is hidden) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 'var(--space-10)',
          }}
            className="login-mobile-brand"
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(124,106,247,0.4)',
            }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              TakeUForward
            </span>
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-2)',
          }}>
            {showAlumniForm ? 'Alumni Request' : 'Welcome back'}
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-8)',
            lineHeight: 1.6,
          }}>
            {showAlumniForm
              ? 'Submit your details to get an invite link.'
              : 'Sign in with your official SSN College email to continue.'}
          </p>

          {showAlumniForm ? (
            <form onSubmit={handleAlumniSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input placeholder="Full Name" required value={alumniFormData.name} onChange={e => setAlumniFormData({ ...alumniFormData, name: e.target.value })} />
              <Input type="email" placeholder="Email Address" required value={alumniFormData.email} onChange={e => setAlumniFormData({ ...alumniFormData, email: e.target.value })} />
              <Input placeholder="Department (e.g. CSE)" required value={alumniFormData.dept} onChange={e => setAlumniFormData({ ...alumniFormData, dept: e.target.value })} />
              <Input type="number" placeholder="Graduation Year (e.g. 2020)" required value={alumniFormData.graduationYear} onChange={e => setAlumniFormData({ ...alumniFormData, graduationYear: e.target.value })} />
              <Input placeholder="Current Company / Masters Uni" value={alumniFormData.currentCompany} onChange={e => setAlumniFormData({ ...alumniFormData, currentCompany: e.target.value })} />
              <Input placeholder="Proof Link (LinkedIn/Drive)" required value={alumniFormData.proofLink} onChange={e => setAlumniFormData({ ...alumniFormData, proofLink: e.target.value })} />
              <Textarea placeholder="Optional message to admins..." value={alumniFormData.message} onChange={e => setAlumniFormData({ ...alumniFormData, message: e.target.value })} />

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <Button type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setShowAlumniForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={submittingRequest}>
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          ) : (
            <>



              {/* Google sign-in button */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid var(--border-strong)',
                      borderTopColor: 'var(--primary)',
                      animation: 'spin 0.8s ease-in-out infinite',
                      flexShrink: 0,
                    }} />
                    Redirecting to Google…
                  </>
                ) : (
                  <>
                    <GoogleMark />
                    Sign in with Google
                    <ArrowRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                  </>
                )}
              </Button>

              {/* Domain restriction note */}
              <p style={{
                marginTop: 'var(--space-5)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Only <strong style={{ color: 'var(--text-secondary)' }}>@ssn.edu.in</strong> email addresses are accepted.
                <br />Alumni without an invite?{' '}
                <button
                  type="button"
                  onClick={() => setShowAlumniForm(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 'var(--space-1) var(--space-1)', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Request Access
                </button>
              </p>

              {/* Mobile-only Features */}
              <div className="login-mobile-features" style={{ flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Platform Features</h3>
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'rgba(124,106,247,0.07)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(124,106,247,0.15)',
                  }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(124,106,247,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {text}
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
