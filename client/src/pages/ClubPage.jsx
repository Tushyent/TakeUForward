import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

function ClubPage() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User state to check if they are an admin
  const [user, setUser] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [postError, setPostError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await axiosClient.get('/auth/me');
        setUser(userRes.data.user);

        // Fetch club details and announcements
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
    setPostError('');
    if (!newContent.trim()) {
      setPostError('Content is required');
      return;
    }

    try {
      const response = await axiosClient.post(`/clubs/${id}/posts`, {
        title: newTitle,
        content: newContent
      });
      // Prepend the new announcement
      const populatedPost = {
        ...response.data,
        authorId: { name: user.name, role: user.role }
      };
      setAnnouncements([populatedPost, ...announcements]);
      setNewTitle('');
      setNewContent('');
    } catch (err) {
      setPostError(err.response?.data?.error?.message || 'Failed to post announcement');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading club details...</div>;
  }

  if (error || !club) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error || 'Club not found'}</p>
        <Link to="/clubs">Back to Clubs</Link>
      </div>
    );
  }

  const isAdmin = club.adminIds.includes(user?._id) || user?.clubId === club._id;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Link to="/clubs" style={{ textDecoration: 'none', color: '#007BFF', marginBottom: '20px', display: 'inline-block' }}>
          &larr; Back to Clubs
        </Link>

      <div style={{ padding: '2rem', border: '1px solid #333', borderRadius: '8px', marginBottom: '2rem', backgroundColor: '#f9f9f9' }}>
        <h1 style={{ marginTop: 0 }}>{club.name}</h1>
        <p style={{ fontSize: '1.1rem', color: '#555' }}>{club.description}</p>
        {isAdmin && (
          <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#007BFF', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>
            You are a Club Admin
          </span>
        )}
      </div>

      {isAdmin && (
        <div style={{ padding: '1.5rem', border: '1px dashed #666', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3>Post an Announcement</h3>
          <form onSubmit={handlePostAnnouncement}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Optional Title (e.g. Upcoming Hackathon!)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="Write your announcement details here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows="4"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            {postError && <p style={{ color: 'red', marginTop: 0 }}>{postError}</p>}
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}>
              Post Announcement
            </button>
          </form>
        </div>
      )}

      <h2>Club Announcements</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {announcements.length === 0 ? (
          <p>No announcements posted yet.</p>
        ) : (
          announcements.map(post => (
            <div key={post._id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                <span>Posted by {post.authorId?.name}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}

export default ClubPage;
