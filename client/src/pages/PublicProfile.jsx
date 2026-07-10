import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import EmptyState from '../components/ui/EmptyState';
import { UserX } from 'lucide-react';

function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myUsername, setMyUsername] = useState(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [profRes, meRes] = await Promise.all([
        axiosClient.get(`/users/${username}`),
        axiosClient.get('/auth/me').catch(() => ({ data: { user: {} } }))
      ]);
      setProfile(profRes.data);
      setMyUsername(meRes.data.user?.username);
    } catch (err) {
      setError(err.response?.data?.error || 'Profile not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <div><Spinner text="Loading profile..." /></div>;
  if (error) return <div><EmptyState icon={UserX} title="Error" message={error} action={{ label: 'Retry', onClick: fetchProfile }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (!profile) return null;

  const isMe = myUsername === username;

  return (
    <div className="page-transition">
            <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {profile.name}
                {profile.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={profile.isVerifiedAlumni} />}
              </h1>
              <p style={{ color: 'var(--text)', fontSize: '1.1em', margin: '0 0 15px 0' }}>@{profile.username}</p>
            </div>
            {isMe && (
              <Link to="/settings/profile" style={{ textDecoration: 'none' }}>
                <Badge variant="primary" style={{ padding: '8px 12px', cursor: 'pointer' }}>Edit Profile</Badge>
              </Link>
            )}
            {!isMe && profile.whatsappNumber && (
              <a 
                href={`https://wa.me/91${profile.whatsappNumber.replace(/\D/g, '')}?text=Hi ${profile.name}, I found your profile on TakeUForward.`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Badge variant="success" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  WhatsApp
                </Badge>
              </a>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Badge variant="secondary">⭐ {profile.reputation} Rep</Badge>
            {profile.role === 'alumni' && <Badge variant="success">Alumni</Badge>}
            {profile.role === 'student' && <Badge variant="info">Student</Badge>}
            {profile.dept && <Badge variant="primary">📚 {profile.dept}</Badge>}
            {profile.currentCompany && <Badge variant="info">🏢 {profile.currentCompany}</Badge>}
          </div>

          {(profile.bio || profile.about) && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>About</h3>
              <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                {profile.about || profile.bio}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Skills</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.skills.map((skill, i) => (
                    <Badge key={`skill-${i}-${skill}`} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Interests</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.interests.map((interest, i) => (
                    <Badge key={`interest-${i}-${interest}`} variant="primary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {profile.experience && profile.experience.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Experience</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile.experience.map((exp, i) => (
                    <div key={`exp-${i}`} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.projects && profile.projects.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile.projects.map((proj, i) => (
                    <div key={`proj-${i}`} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{proj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(profile.year || profile.graduationYear || profile.higherEducation) && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Education</h3>
              {profile.graduationYear && <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}><strong>Graduated:</strong> {profile.graduationYear}</p>}
              {profile.year && !profile.graduationYear && <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}><strong>Class of:</strong> {profile.year}</p>}
              {profile.higherEducation && <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}><strong>Higher Ed:</strong> {profile.higherEducation}</p>}
            </div>
          )}

          {profile.socialLinks && Object.values(profile.socialLinks).some(v => !!v) && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Links</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>LinkedIn</a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>GitHub</a>
                )}
                {profile.socialLinks.instagram && (
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Instagram</a>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default PublicProfile;
