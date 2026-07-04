import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function CommunityPosts() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = React.useCallback(async () => {
    try {
      const response = await axiosClient.get(`/posts?communityId=${id}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  }, [id]);

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

    try {
      await axiosClient.post('/posts', {
        communityId: id,
        content: newPostContent,
        isAnonymous
      });
      setNewPostContent('');
      setIsAnonymous(false);
      fetchPosts(); // Refresh list
    } catch (err) {
      setError('Failed to create post');
      console.error(err);
    }
  };

  if (error) return <div>{error}</div>;
  if (!community) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/home">← Back to Home</Link>
      <h1>{community.name}</h1>
      <p>{community.description}</p>
      
      <hr />

      <form onSubmit={handleCreatePost} style={{ marginBottom: '2rem' }}>
        <h3>Create a Post</h3>
        <textarea 
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
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
        <button type="submit" style={{ marginTop: '10px' }}>Post</button>
      </form>

      <hr />

      <h2>Posts</h2>
      {posts.length === 0 ? <p>No posts yet.</p> : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {posts.map((post) => (
            <li key={post._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>{post.content}</strong></p>
              <small>
                By: {post.isAnonymous ? 'Anonymous' : (post.authorId?.name || 'Unknown')} 
                {' | '} 
                Posted: {new Date(post.createdAt).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CommunityPosts;
