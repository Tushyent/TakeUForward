import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import MentionTextarea from '../components/MentionTextarea';

import SearchFilterBar from '../components/SearchFilterBar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import { ThumbsUp, Send, Bookmark, Flag, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ui/ReportModal';

function CommunityPosts() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const targetPostId = searchParams.get('post');
  const targetCommentId = searchParams.get('comment');
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ sort: 'newest' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const fetchPosts = React.useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ communityId: id, ...filters }).toString();
      const response = await axiosClient.get(`/posts?${queryParams}`);
      setPosts(response.data);
      setError('');
    } catch {
      setError('Failed to load posts');
    }
  }, [id, filters]);

  const fetchBookmarks = React.useCallback(async () => {
    try {
      const response = await axiosClient.get('/bookmarks?type=post');
      setBookmarkedIds(new Set(response.data.map(b => typeof b.itemId === 'object' ? b.itemId._id : b.itemId)));
    } catch {
      // bookmarks are supplementary - skip silently
    }
  }, []);

  const fetchCommunity = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosClient.get(`/communities/${id}`);
      setCommunity(response.data);
    } catch {
      setError('Community not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
    fetchBookmarks();
  }, [fetchCommunity, fetchPosts, fetchBookmarks]);

  useEffect(() => {
    if (loading || posts.length === 0 || (!targetPostId && !targetCommentId)) return;

    const selector = targetCommentId
      ? `[data-comment-id="${targetCommentId}"]`
      : `[data-post-id="${targetPostId}"]`;

    window.requestAnimationFrame(() => {
      const target = document.querySelector(selector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, [loading, posts, targetPostId, targetCommentId]);

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
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleReport = (postId) => {
    setReportingId(postId);
  };

  const submitReport = async (reason) => {
    await axiosClient.post(`/posts/${reportingId}/report`, { reason });
    fetchPosts();
    toast.success('Post reported successfully');
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
    } catch {
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
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to completely delete this post?')) return;
    try {
      await axiosClient.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete post');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to completely delete this comment?')) return;
    try {
      await axiosClient.delete(`/posts/${postId}/comments/${commentId}`);
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return { ...p, comments: p.comments.filter(c => c._id !== commentId) };
        }
        return p;
      }));
      toast.success('Comment deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete comment');
    }
  };

  if (error) return <div><EmptyState icon={Flag} title="Error" message={error} action={{ label: 'Retry', onClick: () => { fetchCommunity(); fetchPosts(); } }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (!community) return <div><Spinner text="Loading..." /></div>;

  return (
    <div className="page-transition">

      <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>{community.name}</h1>
        <p style={{ marginBottom: 'var(--space-8)', fontSize: 'var(--text-lg)' }}>{community.description}</p>

        <SearchFilterBar filters={filters} setFilters={setFilters} />

        <Card style={{ marginTop: 'var(--space-8)' }}>
          <form onSubmit={handleCreatePost}>
            <h3 style={{ marginTop: 0 }}>Create a Post</h3>
            <MentionTextarea
              value={newPostContent}
              onChange={(val) => setNewPostContent(val)}
              placeholder="What's on your mind?"
              style={{ width: '100%', minHeight: '80px', marginBottom: 'var(--space-4)' }}
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
            <Card
              key={post._id}
              data-post-id={post._id}
              className={targetPostId === post._id && !targetCommentId ? 'notification-target-highlight' : ''}
              style={{ marginBottom: 0 }}
            >
              <p style={{ fontSize: '1.1em', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {post.content}
              </p>
              <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {post.type === 'announcement' && post.clubId ? (
                  <Badge variant="info">📢 Announcement by {post.clubId?.name}</Badge>
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

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onClick={() => handleUpvote(post._id)}>
                  <ThumbsUp size={14} /> Upvote ({post.upvotes?.length || 0})
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleBookmark(post._id)} style={{ color: bookmarkedIds.has(post._id) ? 'var(--primary)' : 'inherit' }}>
                  <Bookmark size={14} fill={bookmarkedIds.has(post._id) ? "currentColor" : "none"} /> {bookmarkedIds.has(post._id) ? 'Saved' : 'Save'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleReport(post._id)}>
                  <Flag size={14} /> Report
                </Button>
                {(user?.isPlatformAdmin || user?._id === post.authorId?._id) && (
                  <Button variant="secondary" size="sm" onClick={() => handleDeletePost(post._id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                )}
              </div>

              <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)', marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Comments</h4>
                {post.comments && post.comments.length > 0 ? (
                  <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 15px 0' }}>
                    {post.comments.map(c => (
                      <li
                        key={c._id}
                        data-comment-id={c._id}
                        className={targetCommentId === c._id ? 'notification-target-highlight' : ''}
                        style={{ marginBottom: '10px', padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px' }}
                      >
                        <p style={{ marginBottom: '5px', color: 'var(--text-primary)' }}>{c.text}</p>
                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                          {(user?.isPlatformAdmin || user?._id === c.authorId?._id) && (
                            <button
                              onClick={() => handleDeleteComment(post._id, c._id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9em' }}
                              title="Delete Comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
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

      <ReportModal
        isOpen={!!reportingId}
        onClose={() => setReportingId(null)}
        onSubmit={submitReport}
        title="Report Post"
        placeholder="Why are you reporting this post?"
      />
    </div>
  );
}

export default CommunityPosts;
