import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    about: '',
    skills: '',
    interests: '',
    socialLinks: { linkedin: '', github: '', instagram: '' },
    profileVisibility: {
      showEmail: true,
      showSocialLinks: true,
      showInterests: true,
      showSkills: true,
      showBio: true,
      showEducation: true
    }
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        const u = res.data.user;
        setProfile({
          about: u.about || u.bio || '',
          skills: u.skills ? u.skills.join(', ') : '',
          interests: u.interests ? u.interests.join(', ') : '',
          socialLinks: u.socialLinks || { linkedin: '', github: '', instagram: '' },
          profileVisibility: u.profileVisibility || {
            showEmail: true, showSocialLinks: true, showInterests: true,
            showSkills: true, showBio: true, showEducation: true
          }
        });
      } catch (_) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        about: profile.about,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: profile.interests.split(',').map(s => s.trim()).filter(Boolean),
        socialLinks: profile.socialLinks,
        profileVisibility: profile.profileVisibility
      };
      await axiosClient.patch('/users/me/profile', payload);
      toast.success('Profile settings saved successfully');
    } catch (_) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div><Navbar /><Spinner text="Loading settings..." /></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: '20px' }}>Profile Settings</h1>
        
        <form onSubmit={handleSave}>
          <Card style={{ marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Public Profile Info</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>About Me</label>
              <textarea 
                name="about"
                value={profile.about}
                onChange={e => handleChange(e)}
                style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit' }}
                placeholder="Write a little about yourself..."
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>Skills (comma separated)</label>
              <Input name="skills" value={profile.skills} onChange={e => handleChange(e)} placeholder="React, Node.js, Python..." style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>Interests (comma separated)</label>
              <Input name="interests" value={profile.interests} onChange={e => handleChange(e)} placeholder="Machine Learning, Web Dev, Photography..." style={{ width: '100%' }} />
            </div>

            <h3 style={{ marginTop: '25px', marginBottom: '15px' }}>Social Links</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>LinkedIn URL</label>
                <Input value={profile.socialLinks.linkedin} onChange={e => handleChange(e, 'socialLinks', 'linkedin')} placeholder="https://linkedin.com/in/..." style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>GitHub URL</label>
                <Input value={profile.socialLinks.github} onChange={e => handleChange(e, 'socialLinks', 'github')} placeholder="https://github.com/..." style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-h)' }}>Instagram URL</label>
                <Input value={profile.socialLinks.instagram} onChange={e => handleChange(e, 'socialLinks', 'instagram')} placeholder="https://instagram.com/..." style={{ width: '100%' }} />
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Privacy & Visibility</h2>
            <p style={{ color: 'var(--text)', marginBottom: '20px' }}>Toggle which sections appear on your public profile.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(profile.profileVisibility).map(([key, value]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-h)' }}>
                  <input type="checkbox" checked={value} onChange={() => handleToggle(key)} style={{ width: '18px', height: '18px' }} />
                  {key.replace('show', 'Show ')}
                </label>
              ))}
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
