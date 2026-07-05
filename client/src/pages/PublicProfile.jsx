import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myUsername, setMyUsername] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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
    };
    fetchProfile();
  }, [username]);

  if (loading) return <div><Navbar /><Spinner text="Loading profile..." /></div>;
  if (error) return <div><Navbar /><div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div></div>;
  if (!profile) return null;

  const isMe = myUsername === username;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
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
              <p style={{ color: 'var(--text-h)', margin: 0, lineHeight: 1.6 }}>
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
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Interests</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.interests.map((interest, i) => (
                    <Badge key={i} variant="primary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(profile.year || profile.graduationYear || profile.higherEducation) && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Education</h3>
              {profile.graduationYear && <p style={{ margin: '5px 0', color: 'var(--text-h)' }}><strong>Graduated:</strong> {profile.graduationYear}</p>}
              {profile.year && !profile.graduationYear && <p style={{ margin: '5px 0', color: 'var(--text-h)' }}><strong>Class of:</strong> {profile.year}</p>}
              {profile.higherEducation && <p style={{ margin: '5px 0', color: 'var(--text-h)' }}><strong>Higher Ed:</strong> {profile.higherEducation}</p>}
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
