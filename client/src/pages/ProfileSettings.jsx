import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Textarea } from '../components/ui/Input';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle } from 'lucide-react';

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
    } catch (err) {
      console.error(err);
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
        });
      });
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
      } catch (err) {
        console.error(err);
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
      } catch (err) {
        console.error(err);
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
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchMe }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (loading) return <div><Spinner text="Loading settings..." /></div>;

  return (
    <div className="page-transition">
            <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginTop: 0, marginBottom: '20px' }}>Profile Settings</h1>
        
        <form onSubmit={handleSave}>
          <Card style={{ marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Public Profile Info</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>About Me</label>
              <Textarea 
                name="about"
                value={profile.about}
                onChange={e => handleChange(e)}
                style={{ width: '100%', minHeight: '100px' }}
                placeholder="Write a little about yourself..."
                aria-label="About Me"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Skills (comma separated)</label>
              <Input name="skills" value={profile.skills} onChange={e => handleChange(e)} placeholder="React, Node.js, Python..." style={{ width: '100%' }} aria-label="Skills" />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Interests (comma separated)</label>
              <Input name="interests" value={profile.interests} onChange={e => handleChange(e)} placeholder="Machine Learning, Web Dev, Photography..." style={{ width: '100%' }} aria-label="Interests" />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Experience (comma separated)</label>
              <Input name="experience" value={profile.experience} onChange={e => handleChange(e)} placeholder="SWE Intern at Google, GDSC Lead..." style={{ width: '100%' }} aria-label="Experience" />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Projects (comma separated)</label>
              <Input name="projects" value={profile.projects} onChange={e => handleChange(e)} placeholder="TakeUForward, React Native App..." style={{ width: '100%' }} aria-label="Projects" />
            </div>

            <h3 style={{ marginTop: '25px', marginBottom: '15px' }}>Contact Links</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>WhatsApp Number (for wa.me click-to-chat)</label>
              <Input name="whatsappNumber" type="tel" value={profile.whatsappNumber} onChange={e => handleChange(e)} placeholder="e.g. 9876543210" style={{ width: '100%' }} aria-label="WhatsApp Number" />
            </div>

            <div className="grid-2-col" style={{ gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>LinkedIn URL</label>
                <Input value={profile.socialLinks.linkedin} onChange={e => handleChange(e, 'socialLinks', 'linkedin')} placeholder="https://linkedin.com/in/..." style={{ width: '100%' }} aria-label="LinkedIn URL" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>GitHub URL</label>
                <Input value={profile.socialLinks.github} onChange={e => handleChange(e, 'socialLinks', 'github')} placeholder="https://github.com/..." style={{ width: '100%' }} aria-label="GitHub URL" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>Instagram URL</label>
                <Input value={profile.socialLinks.instagram} onChange={e => handleChange(e, 'socialLinks', 'instagram')} placeholder="https://instagram.com/..." style={{ width: '100%' }} aria-label="Instagram URL" />
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Privacy & Settings</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={profile.weeklyDigestOptIn} onChange={() => setProfile(prev => ({ ...prev, weeklyDigestOptIn: !prev.weeklyDigestOptIn }))} style={{ width: '18px', height: '18px' }} />
                Receive Weekly Digest Emails
              </label>
            </div>

            {pushSupported && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={webPushOptIn} onChange={handlePushToggle} style={{ width: '18px', height: '18px' }} />
                  Receive Web Push Notifications (Mentions & Replies)
                </label>
              </div>
            )}

            <h3 style={{ marginBottom: '15px' }}>Visibility</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(profile.profileVisibility).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^show/, 'Show ').trim();
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={value} onChange={() => handleToggle(key)} style={{ width: '18px', height: '18px' }} />
                    {label}
                  </label>
                );
              })}
            </div>
          </Card>

          <Button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', fontSize: '1.1em' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettings;
