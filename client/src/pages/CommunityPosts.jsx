import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import MentionTextarea from '../components/MentionTextarea';
import Navbar from '../components/Navbar';
import SearchFilterBar from '../components/SearchFilterBar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import { ThumbsUp, Send, Bookmark, Flag, MessageSquare } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

function CommunityPosts() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ sort: 'newest' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const fetchPosts = React.useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ communityId: id, ...filters }).toString();
      const response = await axiosClient.get(`/posts?${queryParams}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  }, [id, filters]);

  const fetchBookmarks = React.useCallback(async () => {
    try {
      const response = await axiosClient.get('/bookmarks?type=post');
      setBookmarkedIds(new Set(response.data.map(b => typeof b.itemId === 'object' ? b.itemId._id : b.itemId)));
    } catch (err) {
      console.error('Error fetching bookmarks', err);
    }
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await axiosClient.get(`/communities/${id}`);
        setCommunity(response.data);
      } catch (err) {
        console.error('Error fetching community', err);
        setError('Community not found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunity();
    fetchPosts();
    fetchBookmarks();
  }, [id, fetchPosts, fetchBookmarks]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      await axiosClient.post('/posts', {
        communityId: id,
        content: newPostContent,
        isAnonymous
      });
      setNewPostContent('');
      setIsAnonymous(false);
      toast.success('Post created successfully!');
      fetchPosts(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create post');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [commentInputs, setCommentInputs] = useState({});
  const [commentAnonymity, setCommentAnonymity] = useState({});

  const handleUpvote = async (postId) => {
    try {
      await axiosClient.post(`/posts/${postId}/upvote`);
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upvote');
    }
  };

  const handleReport = async (postId) => {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;
    try {
      await axiosClient.post(`/posts/${postId}/report`, { reason });
      fetchPosts();
      toast.success('Post reported successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to report post');
    }
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setIsSubmitting(true);
    try {
      await axiosClient.post(`/posts/${postId}/comment`, {
        text,
        isAnonymous: !!commentAnonymity[postId]
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setCommentAnonymity(prev => ({ ...prev, [postId]: false }));
      toast.success('Comment posted!');
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookmark = async (postId) => {
    try {
      await axiosClient.post('/bookmarks', { itemType: 'post', itemId: postId });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
      toast.success('Bookmark updated');
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  if (error) return <div><Navbar /><EmptyState icon={Flag} message={error} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (!community) return <div><Navbar /><Spinner text="Loading..." /></div>;

  return (
    <div className="page-transition">
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>{community.name}</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>{community.description}</p>
        
        <SearchFilterBar filters={filters} setFilters={setFilters} />

        <Card style={{ marginTop: '2rem' }}>
          <form onSubmit={handleCreatePost}>
            <h3 style={{ marginTop: 0 }}>Create a Post</h3>
            <MentionTextarea 
              value={newPostContent}
              onChange={(val) => setNewPostContent(val)}
              placeholder="What's on your mind?"
              style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Post Anonymously
              </label>
              <Button type="submit" disabled={isSubmitting}>
                <Send size={16} /> {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </Card>

        <h2 style={{ marginTop: '3rem' }}>Posts</h2>
        {loading ? (
          <Spinner text="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState icon={MessageSquare} message="No posts in this community yet." />
        ) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.map((post) => (
              <Card key={post._id} style={{ marginBottom: 0 }}>
                <p style={{ fontSize: '1.1em', marginBottom: '10px', color: 'var(--text-h)' }}>
                  {post.content}
                </p>
                <div style={{ fontSize: '0.85em', color: 'var(--text)', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {post.type === 'announcement' && post.clubId ? (
                    <Badge variant="info">📢 Announcement by {post.clubId.name}</Badge>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      By: {post.isAnonymous ? 'Anonymous' : (
                        <>
                          <Link to={`/profile/${post.authorId?.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                            {post.authorId?.name || 'Unknown'} (@{post.authorId?.handle || 'unknown'})
                          </Link>
                          {post.authorId?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={post.authorId.isVerifiedAlumni} />}
                        </>
                      )}
                      {!post.isAnonymous && post.authorId && (
                        <Link to={`/chat/${post.authorId._id}`} style={{ textDecoration: 'none' }}>
                          <Badge variant="success">Message</Badge>
                        </Link>
                      )}
                    </span>
                  )}
                  <span>• {new Date(post.createdAt).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <Button variant="secondary" onClick={() => handleUpvote(post._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    <ThumbsUp size={14} /> Upvote ({post.upvotes?.length || 0})
                  </Button>
                  <Button variant="secondary" onClick={() => handleBookmark(post._id)} style={{ padding: '6px 12px', fontSize: '13px', color: bookmarkedIds.has(post._id) ? 'var(--primary)' : 'inherit' }}>
                    <Bookmark size={14} fill={bookmarkedIds.has(post._id) ? "currentColor" : "none"} /> {bookmarkedIds.has(post._id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={() => handleReport(post._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    <Flag size={14} /> Report
                  </Button>
                </div>

                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)', marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Comments</h4>
                  {post.comments && post.comments.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 15px 0' }}>
                      {post.comments.map(c => (
                        <li key={c._id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--social-bg)', borderRadius: '6px' }}>
                          <p style={{ marginBottom: '5px', color: 'var(--text-h)' }}>{c.text}</p>
                          <div style={{ fontSize: '0.8em', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {c.isAnonymous ? 'Anonymous' : (
                              <>
                                <Link to={`/profile/${c.authorId?.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                  {c.authorId?.name || 'Unknown'} (@{c.authorId?.handle || 'unknown'})
                                </Link>
                                {c.authorId?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={c.authorId.isVerifiedAlumni} />}
                              </>
                            )}
                            {!c.isAnonymous && c.authorId && (
                              <Link to={`/chat/${c.authorId._id}`} style={{ textDecoration: 'none' }}>
                                <Badge variant="success">Message</Badge>
                              </Link>
                            )}
                            <span>• {new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9em', fontStyle: 'italic', marginBottom: '15px' }}>No comments yet.</p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Input 
                      type="text" 
                      placeholder="Add a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!commentAnonymity[post._id]}
                        onChange={(e) => setCommentAnonymity(prev => ({ ...prev, [post._id]: e.target.checked }))}
                      />
                      Anon
                    </label>
                    <Button 
                      onClick={() => handleComment(post._id)}
                      disabled={isSubmitting || !commentInputs[post._id]?.trim()}
                    >
                      <Send size={14} /> Reply
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityPosts;
