import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle } from 'lucide-react';

function ChatThread() {
  const { userId } = useParams();
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axiosClient.get('/auth/me').then(res => setMyUserId(res.data.user._id)).catch(console.error);
  }, []);

  const fetchChat = useCallback(async () => {
    try {
      const response = await axiosClient.get(`/chats/${userId}`);
      setChat(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chat');
    }
  }, [userId]);

  useEffect(() => {
    fetchChat();
    // 8s polling — real-time enough for chat, 60% fewer requests than 3s
    const interval = setInterval(fetchChat, 8000);
    return () => clearInterval(interval);
  }, [fetchChat]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      await axiosClient.post(`/chats/${userId}/message`, { text });
      setText('');
      fetchChat(); 
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div><EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchChat }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} /></div>;
  if (!chat) return <div><Spinner text="Loading chat..." /></div>;

  const otherUser = chat.participants.find(p => p._id !== myUserId);

  return (
    <div className="page-transition">
            <div className="page-col page-col-feed" style={{ paddingBlock: 'var(--space-8)', display: 'flex', flexDirection: 'column', height: '80vh' }}>
        <Link to="/chats" style={{ marginBottom: '1rem', textDecoration: 'none', color: 'var(--text-secondary)', display: 'inline-block' }}>
          &larr; Back to Inbox
        </Link>
        
        <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
          Chat with {otherUser?.name}
          {otherUser?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={otherUser.isVerifiedAlumni} style={{ marginLeft: '10px' }} />}
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-base)' }}>
          {chat.messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '2rem' }}>No messages yet. Say hi!</p>
          ) : (
            chat.messages.map((msg, idx) => {
              const isMine = msg.senderId._id === myUserId;
              return (
                <div key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ 
                    background: isMine ? 'var(--primary)' : 'var(--bg-surface)', 
                    color: isMine ? 'white' : 'var(--text-primary)', 
                    padding: '10px 15px', 
                    borderRadius: '15px',
                    borderBottomRightRadius: isMine ? '2px' : '15px',
                    borderBottomLeftRadius: !isMine ? '2px' : '15px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', marginTop: '1rem', gap: '10px' }}>
          <Input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Type a message..." 
            style={{ flex: 1 }}
          />
          <Button type="submit" disabled={isSubmitting} style={{ whiteSpace: 'nowrap' }}>
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatThread;
