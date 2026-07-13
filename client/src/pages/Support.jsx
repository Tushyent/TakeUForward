import React, { useState, useRef } from 'react';
import { Upload, MapPin, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import axiosClient from '../api/axiosClient';
import FilePreview from '../components/ui/FilePreview';

const Support = () => {
  const screenshotInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bug',
    pageContext: '',
    screenshotUrls: [],
    displayNamePublicly: false, // User chose Option B
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'my-tickets'
  
  // My Tickets state
  const [myTickets, setMyTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const fetchMyTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const { data } = await axiosClient.get('/support/my-tickets');
      setMyTickets(data.tickets);
    } catch {
      toast.error('Failed to load your tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'my-tickets') {
      fetchMyTickets();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.screenshotUrls.length + files.length > 4) {
      toast.error('Maximum 4 screenshots allowed');
      return;
    }

    try {
      setIsUploading(true);
      const newUrls = [];

      await Promise.all(files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 5MB limit`);
          return;
        }

        const { data } = await axiosClient.post('/support/upload-url', {
          fileName: file.name,
          fileType: file.type
        });

        const { uploadUrl, fileUrl } = data;

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });

        newUrls.push(fileUrl);
      }));

      setFormData(prev => ({ ...prev, screenshotUrls: [...prev.screenshotUrls, ...newUrls] }));
      if (newUrls.length > 0) toast.success('Screenshot(s) uploaded successfully');
    } catch (err) {
      console.error('Upload error', err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.error || 'Failed to upload screenshot(s)');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeScreenshot = (index) => {
    setFormData(prev => {
      const newUrls = [...prev.screenshotUrls];
      newUrls.splice(index, 1);
      return { ...prev, screenshotUrls: newUrls };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosClient.post('/support', formData);
      toast.success('Support ticket submitted successfully. We will look into it!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'bug',
        pageContext: '',
        screenshotUrls: [],
        displayNamePublicly: false,
      });
      document.getElementById('screenshot-upload').value = '';
    } catch (err) {
      console.error('Error submitting ticket', err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="page-col page-col-wide">
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: 0 }}>Support & Feedback</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)' }}>
            Found a bug? Have a feature request? Let the admins know.
          </p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-main)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('submit')}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: activeTab === 'submit' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'submit' ? 'var(--text-main)' : 'var(--text-muted)',
              borderRadius: 'calc(var(--radius) - 2px)',
              cursor: 'pointer',
              fontWeight: activeTab === 'submit' ? 600 : 400,
              boxShadow: activeTab === 'submit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Submit a Ticket
          </button>
          <button 
            onClick={() => setActiveTab('my-tickets')}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: activeTab === 'my-tickets' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'my-tickets' ? 'var(--text-main)' : 'var(--text-muted)',
              borderRadius: 'calc(var(--radius) - 2px)',
              cursor: 'pointer',
              fontWeight: activeTab === 'my-tickets' ? 600 : 400,
              boxShadow: activeTab === 'my-tickets' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            My Tickets
          </button>
        </div>
      </div>

      {activeTab === 'submit' ? (
        <Card style={{ padding: 'var(--space-6)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Category <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ width: '100%' }}
              aria-label="Category"
            >
              <option value="bug">Report a Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <Input
              name="title"
              placeholder="Brief summary of the issue..."
              value={formData.title}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              name="description"
              placeholder="Please provide details..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="input"
              style={{
                width: '100%', resize: 'vertical', minHeight: 120,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Where did this happen? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <Input
              name="pageContext"
              placeholder="e.g., /resources page, or trying to login"
              value={formData.pageContext}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              <Upload size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Screenshot <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              ref={screenshotInputRef}
              id="screenshot-upload"
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleScreenshotUpload}
              disabled={isUploading || isSubmitting || formData.screenshotUrls.length >= 4}
              style={{ display: 'none' }}
            />
            {formData.screenshotUrls.length < 4 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => screenshotInputRef.current?.click()}
                disabled={isUploading || isSubmitting}
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '10px' }}
              >
                <Upload size={15} />
                Upload up to {4 - formData.screenshotUrls.length} more screenshot(s)...
              </Button>
            )}
            
            {isUploading && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', marginBottom: '10px' }}>
                Uploading...
              </div>
            )}
            
            {formData.screenshotUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {formData.screenshotUrls.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '120px' }}>
                    <FilePreview fileUrl={url} />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button type="submit" disabled={isSubmitting || isUploading} style={{ width: '100%' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {isLoadingTickets ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading tickets...</div>
          ) : myTickets.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '50px' }}>
              <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px', display: 'block' }} />
              <h3>No tickets yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>You haven't submitted any support tickets.</p>
              <Button onClick={() => setActiveTab('submit')}>Submit a Ticket</Button>
            </Card>
          ) : (
            myTickets.map(ticket => (
              <Card key={ticket._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <Badge variant="primary">{ticket.category.replace('_', ' ').toUpperCase()}</Badge>
                      <Badge variant={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ').toUpperCase()}</Badge>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ margin: '5px 0' }}>{ticket.title}</h3>
                  </div>
                </div>
                
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '15px', borderRadius: 'var(--radius)', marginBottom: '15px' }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{ticket.description}</p>
                </div>

                {ticket.adminReplies && ticket.adminReplies.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updates from Admin</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {ticket.adminReplies.map((reply, i) => (
                        <div key={i} style={{ 
                          padding: '12px 15px', 
                          backgroundColor: 'var(--primary-light, rgba(124, 106, 247, 0.1))', 
                          borderLeft: '3px solid var(--primary)', 
                          borderRadius: '0 var(--radius) var(--radius) 0' 
                        }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {new Date(reply.createdAt).toLocaleString()}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{reply.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Support;
