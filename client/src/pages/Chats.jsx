import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, MessageCircle } from 'lucide-react';

function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);

  const fetchChats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const meRes = await axiosClient.get('/auth/me');
      setMyUserId(meRes.data.user._id);

      const response = await axiosClient.get('/chats');
      setChats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  if (loading) return <div><Spinner text="Loading chats..." /></div>;
  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchChats }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  return (
    <div className="page-transition">
            <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginTop: 0 }}>Messages</h1>
        {chats.length === 0 ? (
          <EmptyState icon={MessageCircle} message="You have no active chats yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chats.map(chat => {
              const otherUser = chat.participants.find(p => p._id !== myUserId);
              const displayName = otherUser ? `${otherUser.name} (@${otherUser.handle})` : 'Unknown User';
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <Link key={chat._id} to={`/chat/${otherUser?._id}`} style={{ textDecoration: 'none' }}>
                  <Card style={{ marginBottom: 0, padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.1em', display: 'flex', alignItems: 'center' }}>
                      {displayName}
                      {otherUser?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={otherUser.isVerifiedAlumni} />}
                    </strong>
                    {lastMsg ? (
                      <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg.text}
                      </p>
                    ) : (
                      <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9em', fontStyle: 'italic' }}>
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
