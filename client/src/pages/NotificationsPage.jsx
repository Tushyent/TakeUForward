import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, AtSign, Reply, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const typeConfig = {
  mention:  { icon: AtSign,        color: 'var(--primary)',  label: 'Mentioned you' },
  reply:    { icon: Reply,         color: 'var(--success)',  label: 'Replied to you' },
  comment:  { icon: MessageSquare, color: 'var(--info)',     label: 'New comment' },
  message:  { icon: MessageSquare, color: 'var(--accent)',   label: 'New message' },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (pageNum = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      // We'll reuse the existing GET /api/notifications which returns all by default (no pagination logic built yet)
      // Wait, let's pass page and limit to it just in case backend supports it.
      // Master plan says to use getPaginationParams, so we pass page and limit
      const { data } = await axiosClient.get(`/notifications?page=${pageNum}&limit=20`);
      
      // The backend might return an array if it doesn't support pagination, or an object if it does.
      let newNotifs = [];
      let totalPages = 1;
      
      if (Array.isArray(data)) {
        // Fallback for non-paginated backend endpoint
        newNotifs = data;
        setHasMore(false); // Can't paginate if it's returning the whole array
      } else if (data.notifications) {
        // Proper paginated response
        newNotifs = data.notifications;
        totalPages = data.totalPages;
        setHasMore(pageNum < totalPages);
      }

      setNotifications(prev => isLoadMore ? [...prev, ...newNotifs] : newNotifs);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axiosClient.post(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch { /* silent */ }
    }
    navigate(notif.targetPath || (notif.type === 'message' ? `/chat/${notif.refId}` : '/home'));
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Wait, there is no mass read endpoint? Let's just do it individually for unread ones.
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => axiosClient.post(`/notifications/${n._id}/read`)));
      toast.success('Marked all as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="page-transition">
      <div className="page-col page-col-feed">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Bell size={24} color="var(--primary)" /> Notifications
            </h1>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button variant="secondary" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <Spinner text="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {notifications.map((notif, idx) => {
              const cfg = typeConfig[notif.type] || { icon: Info, color: 'var(--text-muted)', label: 'Notification' };
              const IconComp = cfg.icon;
              
              const displayName = notif.isAnonymousSender ? 'Someone' : (notif.actorName || 'Someone');
              let dynamicLabel = <span>{cfg.label}</span>;
              if (notif.actorName || notif.isAnonymousSender || notif.type === 'message') {
                if (notif.type === 'mention') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> mentioned you</>;
                else if (notif.type === 'reply') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> replied to you</>;
                else if (notif.type === 'comment') dynamicLabel = <><strong style={{color:'var(--text-primary)'}}>{displayName}</strong> commented on your post</>;
                else if (notif.type === 'message') dynamicLabel = <strong style={{color:'var(--text-primary)', fontSize: 'var(--text-base)'}}>{displayName}</strong>;
              }

              return (
                <div
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    background: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.06)',
                    borderBottom: idx === notifications.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(99,102,241,0.06)'}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComp size={18} color={cfg.color} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {dynamicLabel}
                    </p>
                    {notif.contentPreview && (
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: 'var(--text-sm)', 
                        color: notif.type === 'message' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontStyle: notif.type === 'message' ? 'normal' : 'italic'
                      }}>
                        {notif.type === 'message' ? notif.contentPreview : `"${notif.contentPreview}"`}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Button
              variant="secondary"
              onClick={() => fetchNotifications(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
