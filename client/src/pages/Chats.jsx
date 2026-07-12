import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import useDebounce from '../hooks/useDebounce';

function Chats() {
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [meRes, chatsRes, contactsRes] = await Promise.all([
        axiosClient.get('/auth/me'),
        axiosClient.get('/chats'),
        axiosClient.get('/users/contacts')
      ]);
      setMyUserId(meRes.data.user._id);
      setChats(chatsRes.data);
      setContacts(contactsRes.data);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Failed to load inbox');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Users already in a chat with me
  const chattedUserIds = new Set(
    chats.map(chat => {
      const other = chat.participants.find(p => p._id !== myUserId);
      return other?._id;
    }).filter(Boolean)
  );

  // Contacts not yet chatted with
  const otherUsers = contacts.filter(c => !chattedUserIds.has(c._id));

  // Filter by search across both chats and contacts
  const filteredOtherUsers = debouncedSearch
    ? otherUsers.filter(u =>
        u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.handle?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.dept?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : otherUsers;

  const filteredChats = debouncedSearch
    ? chats.filter(chat => {
        const other = chat.participants.find(p => p._id !== myUserId);
        return other
          ? other.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            other.handle?.toLowerCase().includes(debouncedSearch.toLowerCase())
          : false;
      })
    : chats;

  if (loading) return <div><Spinner text="Loading inbox..." /></div>;
  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchData }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;

  return (
    <div className="page-transition">
      <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginTop: 0 }}>Inbox</h1>

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>

        {/* Your Chats */}
        {filteredChats.length > 0 && (
          <>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Your Chats
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
              {filteredChats.map(chat => {
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
          </>
        )}

        {/* No chats yet */}
        {filteredChats.length === 0 && !debouncedSearch && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            You have no active chats yet. Start a conversation below.
          </p>
        )}

        {/* Start Chatting With (admin first, then SSN users) */}
        {filteredOtherUsers.length > 0 && (
          <>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {debouncedSearch ? 'Matching Users' : 'Start Chatting With'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredOtherUsers.map(user => (
                <Link key={user._id} to={`/chat/${user._id}`} style={{ textDecoration: 'none' }}>
                  <Card style={{ marginBottom: 0, padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ color: 'var(--primary)', fontSize: '1.1em', display: 'flex', alignItems: 'center' }}>
                          {user.name}
                          {user.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={user.isVerifiedAlumni} />}
                          {user.isPlatformAdmin && <Badge variant="primary" style={{ marginLeft: '8px' }}>Admin</Badge>}
                        </strong>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85em' }}>
                          @{user.handle || 'unknown'} {user.dept ? `\u2022 ${user.dept}` : ''}
                        </p>
                      </div>
                      <Badge variant="secondary">Chat</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chats;
