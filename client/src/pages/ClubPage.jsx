import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';

function ClubPage() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [user, setUser] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axiosClient.get('/auth/me');
        setUser(userRes.data.user);

        const clubRes = await axiosClient.get(`/clubs/${id}`);
        setClub(clubRes.data.club);
        setAnnouncements(clubRes.data.announcements);
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  if (loading) return <div><Navbar /><Spinner text="Loading club details..." /></div>;
  if (error || !club) return <div><Navbar /><div className="empty-state" style={{ color: 'var(--danger)' }}>{error || 'Club not found'}</div></div>;

  const isAdmin = club.adminIds.includes(user?._id) || user?.clubId === club._id;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Link to="/clubs" style={{ textDecoration: 'none', color: 'var(--text)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Clubs
        </Link>

        <Card style={{ backgroundColor: 'var(--social-bg)' }}>
          <h1 style={{ marginTop: 0 }}>{club.name}</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: isAdmin ? '15px' : 0 }}>{club.description}</p>
          {isAdmin && (
            <Badge variant="primary">You are a Club Admin</Badge>
          )}
        </Card>

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
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '15px', outline: 'none' }}
              >
                <option value="">No Category</option>
                <option value="event">Event</option>
                <option value="placement">Placement</option>
                <option value="hackathon">Hackathon</option>
                <option value="workshop">Workshop</option>
              </select>
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
            <div className="empty-state">No announcements posted yet.</div>
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
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.1em', color: 'var(--text-h)' }}>
                  {post.content}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubPage;
