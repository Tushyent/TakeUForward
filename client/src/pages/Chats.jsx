import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

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

  if (loading) return <div><Navbar /><Spinner text="Loading chats..." /></div>;
  if (error) return <div><Navbar /><div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div></div>;

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Messages</h1>
        {chats.length === 0 ? (
          <div className="empty-state">You have no active chats yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chats.map(chat => {
              const otherUser = chat.participants.find(p => p._id !== myUserId);
              const displayName = otherUser ? `${otherUser.name} (@${otherUser.handle})` : 'Unknown User';
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <Link key={chat._id} to={`/chat/${otherUser?._id}`} style={{ textDecoration: 'none' }}>
                  <Card style={{ marginBottom: 0, padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.1em', display: 'flex', alignItems: 'center' }}>
                      {displayName}
                      {otherUser?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={otherUser.isVerifiedAlumni} />}
                    </strong>
                    {lastMsg ? (
                      <p style={{ margin: '8px 0 0 0', color: 'var(--text)', fontSize: '0.95em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg.text}
                      </p>
                    ) : (
                      <p style={{ margin: '8px 0 0 0', color: 'var(--text)', fontSize: '0.9em', fontStyle: 'italic' }}>
                        No messages yet
                      </p>
                    )}
                  </Card>
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
