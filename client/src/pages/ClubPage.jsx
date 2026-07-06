import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Textarea, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, BellOff } from 'lucide-react';

function ClubPage() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('announcements');
  
  const [user, setUser] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userRes = await axiosClient.get('/auth/me');
      setUser(userRes.data.user);

      const clubRes = await axiosClient.get(`/clubs/${id}`);
      setClub(clubRes.data.club);
      setAnnouncements(clubRes.data.announcements);

      const fetchedUser = userRes.data.user;
      const isClubAdmin = clubRes.data.club.adminIds.includes(fetchedUser?._id) || fetchedUser?.clubId === clubRes.data.club._id;
      
      if (isClubAdmin) {
        try {
          const analyticsRes = await axiosClient.get(`/clubs/${id}/analytics`);
          setAnalytics(analyticsRes.data);
        } catch (err) {
          console.error('Failed to fetch analytics', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post(`/clubs/${id}/posts`, {
        title: newTitle,
        content: newContent,
        category: newCategory || undefined
      });
      const populatedPost = {
        ...response.data,
        authorId: { name: user.name, role: user.role }
      };
      setAnnouncements([populatedPost, ...announcements]);
      setNewTitle('');
      setNewContent('');
      setNewCategory('');
      toast.success('Announcement posted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div><Spinner text="Loading club details..." /></div>;
  if (error || !club) return <div><EmptyState icon={AlertCircle} title="Error" message={error || 'Club not found'} action={{ label: 'Retry', onClick: fetchData }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  const isAdmin = club.adminIds.includes(user?._id) || user?.clubId === club._id;

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <Link to="/clubs" style={{ textDecoration: 'none', color: 'var(--text-secondary)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Clubs
        </Link>

        <Card style={{ backgroundColor: 'var(--bg-surface)' }}>
          <h1 style={{ marginTop: 0 }}>{club.name}</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: isAdmin ? '15px' : 0 }}>{club.description}</p>
          {isAdmin && (
            <Badge variant="primary">You are a Club Admin</Badge>
          )}
        </Card>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <Button 
              variant={activeTab === 'announcements' ? 'primary' : 'secondary'} 
              onClick={() => setActiveTab('announcements')}
            >
              Announcements
            </Button>
            <Button 
              variant={activeTab === 'analytics' ? 'primary' : 'secondary'} 
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </Button>
          </div>
        )}

        {(!isAdmin || activeTab === 'announcements') && (
          <>
            {isAdmin && (
          <Card style={{ borderColor: 'var(--primary)' }}>
            <h3 style={{ marginTop: 0 }}>Post an Announcement</h3>
            <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Input
                type="text"
                placeholder="Optional Title (e.g. Upcoming Hackathon!)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">No Category</option>
                <option value="event">Event</option>
                <option value="placement">Placement</option>
                <option value="hackathon">Hackathon</option>
                <option value="workshop">Workshop</option>
              </Select>
              <Textarea
                placeholder="Write your announcement details here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <Button type="submit" disabled={isSubmitting} style={{ alignSelf: 'flex-start' }}>
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </Button>
            </form>
          </Card>
        )}

        <h2 style={{ marginTop: '3rem' }}>Club Announcements</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {announcements.length === 0 ? (
            <EmptyState icon={BellOff} message="No announcements posted yet." />
          ) : (
            announcements.map(post => (
              <Card key={post._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '0.9em', color: 'var(--text)' }}>
                    Posted by {post.authorId?.name} • {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  {post.category && (
                    <Badge variant="info">{post.category}</Badge>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.1em', color: 'var(--text-primary)' }}>
                  {post.content}
                </div>
              </Card>
            ))
          )}
        </div>
          </>
        )}

        {isAdmin && activeTab === 'analytics' && analytics && (
          <Card style={{ borderColor: 'var(--info)' }}>
            <h2 style={{ marginTop: 0 }}>Club Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{analytics.totalPosts}</div>
                <div style={{ color: 'var(--text)' }}>Total Posts</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{analytics.totalUpvotes}</div>
                <div style={{ color: 'var(--text)' }}>Total Upvotes</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>{analytics.totalComments}</div>
                <div style={{ color: 'var(--text)' }}>Total Comments</div>
              </div>
            </div>

            {analytics.topPost ? (
              <div style={{ background: 'var(--bg-base)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h3 style={{ marginTop: 0 }}>Top Performing Post</h3>
                <div style={{ fontSize: '1.1em', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  {analytics.topPost.content}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Badge variant="success">{analytics.topPost.upvotesCount} Upvotes</Badge>
                  <Badge variant="secondary">{analytics.topPost.type}</Badge>
                </div>
              </div>
            ) : (
              <p>No posts available to calculate top performing post.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default ClubPage;
