import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import EmptyState from '../components/ui/EmptyState';
import { UserX, MessageSquare, FileText, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import useSEO from '../hooks/useSEO';

function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);

  useSEO({
    title: profile ? `${profile.name} (@${profile.username})` : 'Public Profile - TakeUForward SSN',
    description: profile ? `View public academic profile, skills, and projects of ${profile.name} (@${profile.username}) on the TakeUForward SSN campus network.` : 'SSN campus public profile.',
    keywords: profile ? `${profile.name}, @${profile.username}, SSN Profile, SSN Alumni, SSN Student` : 'SSN Profile',
    canonical: `https://takeuforward.blastorz.fun/profile/${username}`
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myUsername, setMyUsername] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [experiences, setExperiences] = useState([]);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [profRes, meRes] = await Promise.all([
        axiosClient.get(`/users/${username}`),
        axiosClient.get('/auth/me').catch(() => ({ data: { user: {} } }))
      ]);
      const user = profRes.data;
      setProfile(user);
      setMyUsername(meRes.data.user?.username);

      if (user._id) {
        Promise.all([
          axiosClient.get(`/posts?authorId=${user._id}`).catch(() => ({ data: [] })),
          axiosClient.get(`/resources?uploaderId=${user._id}`).catch(() => ({ data: [] })),
          axiosClient.get(`/interview-experiences?authorId=${user._id}`).catch(() => ({ data: [] }))
        ]).then(([postsRes, resRes, expRes]) => {
          setPosts(postsRes.data);
          setResources(resRes.data);
          setExperiences(expRes.data);
        });
      }
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
  
  const hasAboutData = profile.bio || profile.about || (profile.skills && profile.skills.length > 0) || (profile.interests && profile.interests.length > 0) || (profile.experience && profile.experience.length > 0) || (profile.projects && profile.projects.length > 0) || profile.year || profile.graduationYear || profile.higherEducation;

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
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1em', margin: '0 0 15px 0' }}>@{profile.username}</p>
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

          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
            <Button variant={activeTab === 'about' ? 'primary' : 'ghost'} onClick={() => setActiveTab('about')}>About</Button>
            <Button variant={activeTab === 'posts' ? 'primary' : 'ghost'} onClick={() => setActiveTab('posts')}>Posts ({posts.length})</Button>
            <Button variant={activeTab === 'resources' ? 'primary' : 'ghost'} onClick={() => setActiveTab('resources')}>Resources ({resources.length})</Button>
            <Button variant={activeTab === 'experiences' ? 'primary' : 'ghost'} onClick={() => setActiveTab('experiences')}>Experiences ({experiences.length})</Button>
          </div>

          {activeTab === 'about' && (
            <div>
              {!hasAboutData ? (
                <EmptyState icon={UserX} title="Nothing to see here" message="This user hasn't filled out their profile yet." />
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No posts yet" message="This user hasn't posted anything." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {posts.map(post => (
                    <Card key={post._id} style={{ background: 'var(--bg-input)' }}>
                      <p style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{post.content}</p>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>❤️ {post.upvotes?.length || 0}</span>
                        <Link to={`/community/${post.communityId}?post=${post._id}`} style={{ color: 'var(--primary)' }}>View Post</Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              {resources.length === 0 ? (
                <EmptyState icon={FileText} title="No resources" message="This user hasn't uploaded any resources." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {resources.map(res => (
                    <Card key={res._id} style={{ background: 'var(--bg-input)' }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{res.title}</h4>
                      <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9em' }}>{res.courseCode}</p>
                      <div style={{ fontSize: '0.85em', display: 'flex', gap: '10px' }}>
                        <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Download</a>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'experiences' && (
            <div>
              {experiences.length === 0 ? (
                <EmptyState icon={Briefcase} title="No experiences" message="This user hasn't shared any interview experiences." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {experiences.map(exp => (
                    <Card key={exp._id} style={{ background: 'var(--bg-input)' }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{exp.company} - {exp.role}</h4>
                      <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9em' }}>Batch: {exp.batchYear} • Outcome: <span style={{textTransform: 'capitalize'}}>{exp.overallOutcome}</span></p>
                      <div style={{ fontSize: '0.85em', display: 'flex', gap: '10px' }}>
                        <Link to={`/interview-experiences`} style={{ color: 'var(--primary)' }}>View</Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default PublicProfile;
