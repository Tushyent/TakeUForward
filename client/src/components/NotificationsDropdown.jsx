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

const NotificationsDropdown = ({ placement = 'bottom-right' }) => {
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
    navigate(notif.targetPath || (notif.type === 'message' ? `/chat/${notif.refId}` : '/home'));
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
          background: isOpen ? 'var(--primary-subtle)' : 'transparent',
          border: '1px solid ' + (isOpen ? 'rgba(99,102,241,0.35)' : 'transparent'),
          color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
        }}
        title="Notifications"
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--primary-subtle)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
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
            animation: 'pulseGlow 2s ease-in-out infinite',
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          ...(placement.startsWith('top') ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
          ...(placement.endsWith('left') ? { left: 0 } : { right: 0 }),
          width: 'min(320px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(14, 14, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08)',
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
                  background: 'var(--gradient-primary)',
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

                const displayName = notif.isAnonymousSender ? 'Someone' : (notif.actorName || 'Someone');
                let dynamicLabel = <span>{cfg.label}</span>;
                if (notif.actorName || notif.isAnonymousSender || notif.type === 'message') {
                  if (notif.type === 'mention') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> mentioned you</>;
                  else if (notif.type === 'reply') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> replied to you</>;
                  else if (notif.type === 'comment') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> commented on your post</>;
                  else if (notif.type === 'message') dynamicLabel = <strong style={{color:'var(--text-primary)', fontSize: '13px'}}>{displayName}</strong>;
                }

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-5)',
                      cursor: 'pointer',
                      background: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.06)',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(99,102,241,0.06)'}
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
                        {dynamicLabel}
                      </p>
                      {notif.contentPreview && (
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: 'var(--text-xs)', 
                          color: notif.type === 'message' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontStyle: notif.type === 'message' ? 'normal' : 'italic'
                        }}>
                          {notif.type === 'message' ? notif.contentPreview : `"${notif.contentPreview}"`}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: 'var(--space-2)',
              borderTop: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  padding: 'var(--space-2)'
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
