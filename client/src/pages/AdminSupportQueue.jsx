import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Filter, Trash2, ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import FilePreview from '../components/ui/FilePreview';
import { Select } from '../components/ui/Input';
import { Link } from 'react-router-dom';

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
      toast.success('Ticket status updated');
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
    return <div className="page-col" style={{ textAlign: 'center', padding: '50px' }}>Loading support queue...</div>;
  }

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        
        {/* --- Back button & Header --- */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Support Queue
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-sm)' }}>
                  Review platform feedback, questions, and bug reports from users.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={16} color="var(--text-secondary)" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '180px', margin: 0 }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </Select>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '50px' }}>
            <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px', display: 'block' }} />
            <h3>No tickets found</h3>
            <p style={{ color: 'var(--text-muted)' }}>The support queue is empty.</p>
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
                Load More Tickets
              </Button>
            )}
          </div>
        )}
      </div>
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
    <Card style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <Badge variant="primary">{ticket.category.replace('_', ' ').toUpperCase()}</Badge>
            <Badge variant={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ').toUpperCase()}</Badge>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 700 }}>{ticket.title}</h3>
        </div>
        {!isEditing && !isReplying && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setIsReplying(true)}>
              Reply
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Update Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(ticket._id)} style={{ color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.3)' }} title="Delete Ticket">
              <Trash2 size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* Description Context block */}
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '15px'
      }}>
        <p style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {ticket.description}
        </p>

        {ticket.pageContext && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Url Context:</strong> 
            <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{ticket.pageContext}</code>
          </div>
        )}

        {(ticket.screenshotUrls?.length > 0 || ticket.screenshotUrl) && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Attached Screenshots:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(ticket.screenshotUrls?.length > 0 ? ticket.screenshotUrls : [ticket.screenshotUrl]).map((url, i) => (
                <div key={i} style={{ width: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <FilePreview fileUrl={url} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submitted by info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <User size={13} />
          <span>
            Submitted by: <strong style={{ color: 'var(--text-secondary)' }}>{ticket.authorId?.name}</strong> ({ticket.authorId?.email})
          </span>
          {ticket.displayNamePublicly && <Badge variant="success" size="sm">Public</Badge>}
        </div>
      </div>

      {/* Editing section */}
      {isEditing && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Update Ticket Status</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </Select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Admin Notes (Internal)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal debugging or lookup notes here..."
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}
              rows={3}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleSave} variant="primary">Save Notes</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Replying section */}
      {isReplying && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-elevated)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>Reply to User via Notification</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '12px' }}>
            This will send an in-app notification to the student/alumni and append the text to their replies thread.
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply to the user here..."
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
              rows={4}
            />
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Set status to:</label>
            <Select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
              style={{ width: '160px', margin: 0 }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="primary"
              onClick={async () => {
                if (!replyText.trim()) return toast.error('Reply text cannot be empty');
                setReplying(true);
                try {
                  const { data } = await axiosClient.post(`/support/${ticket._id}/reply`, {
                    replyText: replyText.trim(),
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
            <Button variant="ghost" onClick={() => setIsReplying(false)} disabled={replying}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Internal Admin notes */}
      {!isEditing && ticket.adminNotes && (
        <div style={{ marginTop: '15px', padding: '10px var(--space-4)', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: 'var(--text-xs)' }}>
          <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: 2 }}>Admin Notes (Internal):</strong> 
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ticket.adminNotes}</span>
        </div>
      )}

      {/* Past replies list */}
      {!isEditing && ticket.adminReplies && ticket.adminReplies.length > 0 && (
        <div style={{ marginTop: '15px', borderTop: '1px solid var(--border-subtle)', paddingTop: '15px' }}>
          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Past Replies to User:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ticket.adminReplies.map((reply, i) => (
              <div key={i} style={{ 
                padding: '10px var(--space-4)', 
                backgroundColor: 'var(--bg-elevated)', 
                borderLeft: '3px solid var(--primary)', 
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Calendar size={11} />
                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{reply.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdminSupportQueue;
