import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function ChatThread() {
  const { userId } = useParams();
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Fetch current user ID for alignment
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
    // Polling every 3 seconds for MVP
    const interval = setInterval(fetchChat, 3000);
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
      fetchChat(); // immediately fetch to update UI
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div><Navbar /><div style={{ padding: '2rem', color: 'red' }}>{error}</div></div>;
  if (!chat) return <div><Navbar /><div style={{ padding: '2rem' }}>Loading chat...</div></div>;

  const otherUser = chat.participants.find(p => p._id !== myUserId);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '80vh' }}>
        <Link to="/chats" style={{ marginBottom: '1rem', textDecoration: 'none', color: '#007BFF' }}>&larr; Back to Inbox</Link>
        
        <h2 style={{ margin: '0 0 1rem 0' }}>Chat with {otherUser?.name}</h2>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chat.messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>No messages yet. Say hi!</p>
          ) : (
            chat.messages.map((msg, idx) => {
              const isMine = msg.senderId._id === myUserId;
              return (
                <div key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ 
                    background: isMine ? '#007BFF' : '#e5e5ea', 
                    color: isMine ? 'white' : 'black', 
                    padding: '10px 15px', 
                    borderRadius: '15px',
                    borderBottomRightRadius: isMine ? '2px' : '15px',
                    borderBottomLeftRadius: !isMine ? '2px' : '15px'
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
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Type a message..." 
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatThread;
