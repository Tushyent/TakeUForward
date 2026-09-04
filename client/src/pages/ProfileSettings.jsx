import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Textarea } from '../components/ui/Input';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, User, Link2, Settings2, Eye, Bell, Save } from 'lucide-react';

function ProfileSettings() {
  const { fetchAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [webPushOptIn, setWebPushOptIn] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [profile, setProfile] = useState({
    about: '',
    skills: '',
    interests: '',
    experience: '',
    projects: '',
    whatsappNumber: '',
    socialLinks: { linkedin: '', github: '', instagram: '' },
    profileVisibility: {
      showEmail: true,
      showSocialLinks: true,
      showInterests: true,
      showSkills: true,
      showExperience: true,
      showProjects: true,
      showWhatsapp: true,
      showBio: true,
      showEducation: true
    },
    weeklyDigestOptIn: true
  });

  const fetchMe = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get('/auth/me');
      const u = res.data.user;
      setProfile({
        about: u.about || u.bio || '',
        skills: u.skills ? u.skills.join(', ') : '',
        interests: u.interests ? u.interests.join(', ') : '',
        experience: u.experience ? u.experience.join(', ') : '',
        projects: u.projects ? u.projects.join(', ') : '',
        whatsappNumber: u.whatsappNumber || '',
        socialLinks: u.socialLinks || { linkedin: '', github: '', instagram: '' },
        profileVisibility: u.profileVisibility || {
          showEmail: true, showSocialLinks: true, showInterests: true,
          showSkills: true, showExperience: true, showProjects: true,
          showWhatsapp: true, showBio: true, showEducation: true
        },
        weeklyDigestOptIn: u.weeklyDigestOptIn !== false
      });
    } catch {
      setError('Failed to load profile settings');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setWebPushOptIn(true);
        }).catch(() => { });
      }).catch(() => { });
    }

    fetchMe();
  }, [fetchMe]);

  const handleChange = (e, section, field) => {
    if (section) {
      setProfile(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: e.target.value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleToggle = (field) => {
    setProfile(prev => ({
      ...prev,
      profileVisibility: {
        ...prev.profileVisibility,
        [field]: !prev.profileVisibility[field]
      }
    }));
  };

  const handlePushToggle = async () => {
    if (!pushSupported) return toast.error('Push notifications are not supported in this browser.');

    if (webPushOptIn) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await axiosClient.post('/push/unsubscribe', { endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        setWebPushOptIn(false);
        toast.success('Unsubscribed from push notifications');
      } catch {
        toast.error('Failed to unsubscribe');
      }
    } else {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return toast.error('Permission denied for push notifications');
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          return toast.error('VAPID public key not configured in frontend');
        }

        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        await axiosClient.post('/push/subscribe', sub);
        setWebPushOptIn(true);
        toast.success('Subscribed to push notifications');
      } catch {
        toast.error('Failed to subscribe');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        about: profile.about,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: profile.interests.split(',').map(s => s.trim()).filter(Boolean),
        experience: profile.experience.split(',').map(s => s.trim()).filter(Boolean),
        projects: profile.projects.split(',').map(s => s.trim()).filter(Boolean),
        whatsappNumber: profile.whatsappNumber,
        socialLinks: profile.socialLinks,
        profileVisibility: profile.profileVisibility,
        weeklyDigestOptIn: profile.weeklyDigestOptIn
      };
      await axiosClient.patch('/users/me/profile', payload);
      await fetchAuth(); // Update global state
      toast.success('Profile settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchMe }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (loading) return <div><Spinner text="Loading settings..." /></div>;

  return (
    <div className="page-transition">
      <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-6) var(--space-8)' }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-glow)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Settings2 size={18} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Profile Settings</h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              Manage your public profile and privacy
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* ── PUBLIC PROFILE INFO ── */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <User size={16} color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Public Profile Info</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  About Me
                </label>
                <Textarea
                  name="about"
                  value={profile.about}
                  onChange={e => handleChange(e)}
                  style={{ width: '100%', minHeight: '90px' }}
                  placeholder="Write a little about yourself..."
                  aria-label="About Me"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Skills <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- comma separated</span>
                </label>
                <Input name="skills" value={profile.skills} onChange={e => handleChange(e)} placeholder="React, Node.js, Python..." style={{ width: '100%' }} aria-label="Skills" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Interests <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- comma separated</span>
                </label>
                <Input name="interests" value={profile.interests} onChange={e => handleChange(e)} placeholder="Machine Learning, Web Dev, Photography..." style={{ width: '100%' }} aria-label="Interests" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Experience <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- comma separated</span>
                </label>
                <Input name="experience" value={profile.experience} onChange={e => handleChange(e)} placeholder="SWE Intern at Google, GDSC Lead..." style={{ width: '100%' }} aria-label="Experience" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Projects <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- comma separated</span>
                </label>
                <Input name="projects" value={profile.projects} onChange={e => handleChange(e)} placeholder="TakeUForward, React Native App..." style={{ width: '100%' }} aria-label="Projects" />
              </div>
            </div>
          </Card>

          {/* ── CONTACT & LINKS ── */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <Link2 size={16} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Contact & Links</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  WhatsApp Number
                </label>
                <Input name="whatsappNumber" type="tel" value={profile.whatsappNumber} onChange={e => handleChange(e)} placeholder="e.g. 9876543210" style={{ width: '100%' }} aria-label="WhatsApp Number" />
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  Used for wa.me click-to-chat links on your profile
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  LinkedIn URL
                </label>
                <Input value={profile.socialLinks.linkedin} onChange={e => handleChange(e, 'socialLinks', 'linkedin')} placeholder="https://linkedin.com/in/..." style={{ width: '100%' }} aria-label="LinkedIn URL" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  GitHub URL
                </label>
                <Input value={profile.socialLinks.github} onChange={e => handleChange(e, 'socialLinks', 'github')} placeholder="https://github.com/..." style={{ width: '100%' }} aria-label="GitHub URL" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  Instagram URL
                </label>
                <Input value={profile.socialLinks.instagram} onChange={e => handleChange(e, 'socialLinks', 'instagram')} placeholder="https://instagram.com/..." style={{ width: '100%' }} aria-label="Instagram URL" />
              </div>
            </div>
          </Card>

          {/* ── PREFERENCES ── */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <Bell size={16} color="var(--warning)" />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Preferences</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                cursor: 'pointer', padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: profile.weeklyDigestOptIn ? 'var(--primary-glow)' : 'transparent',
                border: '1px solid',
                borderColor: profile.weeklyDigestOptIn ? 'color-mix(in srgb, var(--primary) 28%, transparent)' : 'var(--border-subtle)',
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                <input
                  type="checkbox"
                  checked={profile.weeklyDigestOptIn}
                  onChange={() => setProfile(prev => ({ ...prev, weeklyDigestOptIn: !prev.weeklyDigestOptIn }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }}
                />
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Weekly Digest Emails</span>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    Get a weekly summary of activity
                  </p>
                </div>
              </label>

              {pushSupported && (
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  cursor: 'pointer', padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: webPushOptIn ? 'var(--primary-glow)' : 'transparent',
                  border: '1px solid',
                  borderColor: webPushOptIn ? 'color-mix(in srgb, var(--primary) 28%, transparent)' : 'var(--border-subtle)',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={webPushOptIn}
                    onChange={handlePushToggle}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Push Notifications</span>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      Get notified on mentions and replies
                    </p>
                  </div>
                </label>
              )}
            </div>
          </Card>

          {/* ── VISIBILITY ── */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <Eye size={16} color="var(--success)" />
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Profile Visibility</h2>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: '0 0 var(--space-4) 0', lineHeight: 1.5 }}>
              Toggle which sections of your profile are visible to other students.
            </p>

            <div className="vis-grid">
              {Object.entries(profile.profileVisibility).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^show/i, '').trim();
                return (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    cursor: 'pointer', padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    background: value ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                    border: '1px solid',
                    borderColor: value ? 'color-mix(in srgb, var(--primary) 28%, transparent)' : 'var(--border-subtle)',
                    transition: 'background 0.15s, border-color 0.15s',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-primary)',
                    fontWeight: value ? 600 : 400,
                  }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleToggle(key)}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)', flexShrink: 0 }}
                    />
                    {label || key}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* ── SAVE ── */}
          <div style={{
            position: 'sticky', bottom: 'var(--space-4)',
            zIndex: 10, marginTop: 'var(--space-2)',
          }}>
            <Button type="submit" disabled={saving} style={{
              width: '100%', padding: '14px', fontSize: 'var(--text-base)',
              fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 'var(--space-2)',
            }}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettings;
