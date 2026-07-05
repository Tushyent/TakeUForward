import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const meRes = await axiosClient.get('/auth/me');
        setMyUserId(meRes.data.user._id);

        const response = await axiosClient.get('/chats');
        setChats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  if (loading) return <div><Navbar /><div style={{ padding: '2rem' }}>Loading chats...</div></div>;
  if (error) return <div><Navbar /><div style={{ padding: '2rem', color: 'red' }}>{error}</div></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Messages</h1>
        {chats.length === 0 ? (
          <p>You have no active chats yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chats.map(chat => {
              // Find the OTHER participant to display their name securely
              const otherUser = chat.participants.find(p => p._id !== myUserId);
              // If it fails (e.g. somehow chatting with self), just fallback
              const displayName = otherUser ? `${otherUser.name} (@${otherUser.handle})` : 'Unknown User';
              
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <Link key={chat._id} to={`/chat/${otherUser?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}>
                    <strong>{displayName}</strong>
                    {lastMsg && (
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg.text}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Chats;
