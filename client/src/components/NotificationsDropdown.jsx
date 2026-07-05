import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, AtSign, Reply, Info, X } from 'lucide-react';

const typeConfig = {
  mention:  { icon: AtSign,        color: 'var(--primary)',  label: 'Mentioned you' },
  reply:    { icon: Reply,         color: 'var(--success)',  label: 'Replied to you' },
  comment:  { icon: MessageSquare, color: 'var(--info)',     label: 'New comment' },
  message:  { icon: MessageSquare, color: 'var(--accent)',   label: 'New message' },
};

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosClient.get('/notifications');
      setNotifications(data);
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 60s polling — acceptable latency for notifications, halves background requests vs 30s
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axiosClient.post(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch { /* silent */ }
    }
    setIsOpen(false);
    navigate(notif.type === 'message' ? `/chat/${notif.refId}` : '/home');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: isOpen ? 'var(--bg-elevated)' : 'transparent',
          border: '1px solid ' + (isOpen ? 'var(--border-strong)' : 'transparent'),
          color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'background var(--transition-fast), color var(--transition-fast)',
        }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            background: 'var(--danger)',
            borderRadius: '50%',
            border: '1.5px solid var(--bg-base)',
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color="var(--text-primary)" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                <Info size={24} style={{ margin: '0 auto var(--space-2)', display: 'block', opacity: 0.4 }} />
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => {
                const cfg = typeConfig[notif.type] || { icon: Info, color: 'var(--text-muted)', label: 'Notification' };
                const IconComp = cfg.icon;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-5)',
                      cursor: 'pointer',
                      background: notif.isRead ? 'transparent' : 'rgba(124,106,247,0.05)',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(124,106,247,0.05)'}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComp size={14} color={cfg.color} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {cfg.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
