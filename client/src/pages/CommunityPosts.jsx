import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import MentionTextarea from '../components/MentionTextarea';
import Navbar from '../components/Navbar';
import SearchFilterBar from '../components/SearchFilterBar';
import toast from 'react-hot-toast';

function CommunityPosts() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = React.useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ communityId: id, ...filters }).toString();
      const response = await axiosClient.get(`/posts?${queryParams}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  }, [id, filters]);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await axiosClient.get(`/communities/${id}`);
        setCommunity(response.data);
      } catch (err) {
        console.error('Error fetching community', err);
        setError('Community not found');
      }
    };
    
    fetchCommunity();
    fetchPosts();
  }, [id, fetchPosts]);

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

  if (error) return <div><Navbar /><div style={{ padding: '2rem', color: 'red' }}>{error}</div></div>;
  if (!community) return <div><Navbar /><div style={{ padding: '2rem' }}>Loading community...</div></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Link to="/home">← Back to Home</Link>
      <h1>{community.name}</h1>
      <p>{community.description}</p>
      
      <SearchFilterBar filters={filters} setFilters={setFilters} />

      <hr />

      <form onSubmit={handleCreatePost} style={{ marginBottom: '2rem' }}>
        <h3>Create a Post</h3>
        <MentionTextarea 
          value={newPostContent}
          onChange={(val) => setNewPostContent(val)}
          placeholder="What's on your mind?"
          style={{ width: '100%', height: '80px', marginBottom: '10px' }}
        />
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Post Anonymously
          </label>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>

      <hr />

      <h2>Posts</h2>
      {posts.length === 0 ? <p>No posts yet.</p> : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {posts.map((post) => (
            <li key={post._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>{post.content}</strong></p>
              <small>
                {post.type === 'announcement' && post.clubId ? (
                  <span style={{ color: '#007BFF', fontWeight: 'bold' }}>📢 Announcement by {post.clubId.name} | </span>
                ) : (
                  <span>
                    By: {post.isAnonymous ? 'Anonymous' : `${post.authorId?.name || 'Unknown'} (@${post.authorId?.handle || 'unknown'})`}
                    {!post.isAnonymous && post.authorId && (
                      <Link to={`/chat/${post.authorId._id}`} style={{ marginLeft: '8px', textDecoration: 'none', background: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Message</Link>
                    )}
                    {' | '}
                  </span>
                )}
                Posted: {new Date(post.createdAt).toLocaleString()}
              </small>

              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleUpvote(post._id)}>
                  Upvote ({post.upvotes?.length || 0})
                </button>
                <button onClick={() => handleReport(post._id)} style={{ marginLeft: '10px' }}>
                  Report
                </button>
              </div>

              <hr style={{ margin: '10px 0' }} />
              
              <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #eee' }}>
                <h4>Comments</h4>
                {post.comments && post.comments.length > 0 ? (
                  <ul style={{ paddingLeft: '1rem', marginBottom: '10px' }}>
                    {post.comments.map(c => (
                      <li key={c._id} style={{ marginBottom: '5px' }}>
                        {c.text}
                        <br />
                        <small>
                          - {c.isAnonymous ? 'Anonymous' : `${c.authorId?.name || 'Unknown'} (@${c.authorId?.handle || 'unknown'})`}
                          {!c.isAnonymous && c.authorId && (
                            <Link to={`/chat/${c.authorId._id}`} style={{ marginLeft: '6px', textDecoration: 'none', background: '#28a745', color: 'white', padding: '2px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>Message</Link>
                          )}
                          , {new Date(c.createdAt).toLocaleString()}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ fontSize: '0.9em' }}>No comments yet.</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                  <MentionTextarea
                    placeholder="Write a comment..."
                    value={commentInputs[post._id] || ''}
                    onChange={(val) => setCommentInputs(prev => ({ ...prev, [post._id]: val }))}
                  />
                  <label style={{ fontSize: '0.9em' }}>
                    <input
                      type="checkbox"
                      checked={commentAnonymity[post._id] || false}
                      onChange={e => setCommentAnonymity(prev => ({ ...prev, [post._id]: e.target.checked }))}
                    />
                    Comment Anonymously
                  </label>
                  <button onClick={() => handleComment(post._id)} disabled={isSubmitting} style={{ alignSelf: 'flex-start' }}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}

export default CommunityPosts;
