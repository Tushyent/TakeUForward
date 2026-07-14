import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Filter, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import FilePreview from '../components/ui/FilePreview';

const AdminSupportQueue = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchTickets = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      const query = new URLSearchParams({ page: pageNum, limit: 20 });
      if (statusFilter) query.append('status', statusFilter);

      const { data } = await axiosClient.get(`/support?${query.toString()}`);

      if (pageNum === 1) {
        setTickets(data.tickets);
      } else {
        setTickets(prev => [...prev, ...data.tickets]);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const handleStatusUpdate = async (id, newStatus, adminNotes) => {
    try {
      const { data } = await axiosClient.patch(`/support/${id}/status`, {
        status: newStatus,
        adminNotes
      });
      setTickets(prev => prev.map(t => t._id === id ? data : t));
      toast.success('Ticket updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this support ticket?')) return;
    try {
      await axiosClient.delete(`/support/${id}`);
      setTickets(prev => prev.filter(t => t._id !== id));
      toast.success('Ticket deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete ticket');
    }
  };

  if (loading && page === 1) {
    return <div className="page-col" style={{ textAlign: 'center', padding: '50px' }}>Loading queue...</div>;
  }

  return (
    <div className="page-col page-col-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Support Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Admin dashboard for platform feedback and bug reports</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="wont_fix">Won't Fix</option>
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '50px' }}>
          <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h3>No tickets found</h3>
          <p style={{ color: 'var(--text-muted)' }}>The queue is empty.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {tickets.map(ticket => (
            <TicketCard
              key={ticket._id}
              ticket={ticket}
              onUpdate={handleStatusUpdate}
              onDelete={handleDeleteTicket}
            />
          ))}

          {hasMore && (
            <Button
              variant="outline"
              onClick={() => fetchTickets(page + 1)}
              style={{ alignSelf: 'center', marginTop: '20px' }}
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const TicketCard = ({ ticket, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes || '');
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [replying, setReplying] = useState(false);

  const handleSave = () => {
    onUpdate(ticket._id, status, adminNotes);
    setIsEditing(false);
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'open': return 'danger';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'wont_fix': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <Badge variant="primary">{ticket.category.replace('_', ' ').toUpperCase()}</Badge>
            <Badge variant={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ').toUpperCase()}</Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>
          <h3 style={{ margin: '5px 0' }}>{ticket.title}</h3>
        </div>
        {!isEditing && !isReplying && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Button variant="outline" size="small" onClick={() => setIsReplying(true)}>
              Reply
            </Button>
            <Button variant="outline" size="small" onClick={() => setIsEditing(true)}>
              Update Status
            </Button>
            <Button variant="outline" size="small" onClick={() => onDelete(ticket._id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} title="Delete Ticket">
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'var(--bg-main)',
        padding: '15px',
        borderRadius: 'var(--radius)',
        marginBottom: '15px'
      }}>
        <p style={{ margin: '0 0 15px 0', whiteSpace: 'pre-wrap' }}>{ticket.description}</p>

        {ticket.pageContext && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <strong>Context:</strong> {ticket.pageContext}
          </div>
        )}

        {(ticket.screenshotUrls?.length > 0 || ticket.screenshotUrl) && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <strong>Attached Screenshots:</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(ticket.screenshotUrls?.length > 0 ? ticket.screenshotUrls : [ticket.screenshotUrl]).map((url, i) => (
                <div key={i} style={{ width: '150px' }}>
                  <FilePreview fileUrl={url} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
        <div>
          <strong>Submitted by:</strong> {ticket.authorId?.name} ({ticket.authorId?.email})
          {ticket.displayNamePublicly && <span style={{ marginLeft: '10px', color: 'var(--success)' }}>[Public display okay]</span>}
        </div>
      </div>

      {isEditing && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Update Ticket</h4>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: '8px 12px', width: '200px', borderRadius: 'var(--radius)' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Notes (Internal)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isReplying && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)' }}>Reply to User via Notification</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
            This will send an in-app notification to the user and append a log to the admin notes.
          </p>
          <div style={{ marginBottom: '15px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply to the user here..."
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              rows={4}
            />
          </div>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem' }}>Also update status to:</label>
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius)' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              onClick={async () => {
                if (!replyText.trim()) return toast.error('Reply text cannot be empty');
                setReplying(true);
                try {
                  const { data } = await axiosClient.post(`/support/${ticket._id}/reply`, {
                    replyText,
                    updateStatusTo: replyStatus
                  });
                  onUpdate(ticket._id, data.ticket.status, data.ticket.adminNotes);
                  setIsReplying(false);
                  setReplyText('');
                  toast.success('Notification sent successfully!');
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Failed to send reply');
                } finally {
                  setReplying(false);
                }
              }}
              disabled={replying}
            >
              {replying ? 'Sending Notification...' : 'Send Reply'}
            </Button>
            <Button variant="outline" onClick={() => setIsReplying(false)} disabled={replying}>Cancel</Button>
          </div>
        </div>
      )}

      {!isEditing && ticket.adminNotes && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--warning-bg, rgba(245, 158, 11, 0.1))', borderLeft: '3px solid var(--warning, #f59e0b)', borderRadius: '0 var(--radius) var(--radius) 0' }}>
          <strong>Admin Notes:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{ticket.adminNotes}</span>
        </div>
      )}

      {!isEditing && ticket.adminReplies && ticket.adminReplies.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Past Replies to User:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {ticket.adminReplies.map((reply, i) => (
              <div key={i} style={{ 
                padding: '10px', 
                backgroundColor: 'var(--bg-main)', 
                borderLeft: '3px solid var(--primary)', 
                borderRadius: '0 var(--radius) var(--radius) 0',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {new Date(reply.createdAt).toLocaleString()}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{reply.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdminSupportQueue;
