import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosClient.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds to simulate real-time updates for the bell
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axiosClient.post(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
    
    // Redirect logic - currently redirecting to home since we don't have a single-post view
    setIsOpen(false);
    navigate('/home');
  };

  const getMessage = (type) => {
    switch (type) {
      case 'mention': return 'Someone mentioned you in a post or comment.';
      case 'reply': return 'Someone replied to your post.';
      case 'comment': return 'Someone commented on a post.';
      default: return 'You have a new notification.';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.5rem', position: 'relative', padding: '5px'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'red', color: 'white', borderRadius: '50%',
            padding: '2px 6px', fontSize: '0.8rem', fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          width: '300px', background: 'white', border: '1px solid #ccc',
          color: '#000',
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100, maxHeight: '400px', overflowY: 'auto'
        }}>
          <h4 style={{ margin: 0, padding: '10px', borderBottom: '1px solid #eee' }}>Notifications</h4>
          {notifications.length === 0 ? (
            <p style={{ padding: '10px', color: '#666', textAlign: 'center' }}>No notifications yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {notifications.map(notif => (
                <li 
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: notif.isRead ? 'white' : '#f0f8ff'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? 'white' : '#f0f8ff'}
                >
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {!notif.isRead && <span style={{ color: 'red', marginRight: '5px' }}>●</span>}
                    {getMessage(notif.type)}
                  </p>
                  <small style={{ color: '#888' }}>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
