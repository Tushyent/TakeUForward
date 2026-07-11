import React, { useState } from 'react';
import { Upload, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import axiosClient from '../api/axiosClient';

const Support = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bug',
    pageContext: '',
    screenshotUrl: '',
    displayNamePublicly: false, // User chose Option B
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

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

      setFormData(prev => ({ ...prev, screenshotUrl: fileUrl }));
      toast.success('Screenshot uploaded successfully');
    } catch (err) {
      console.error('Upload error', err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.error || 'Failed to upload screenshot');
    } finally {
      setIsUploading(false);
    }
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
        screenshotUrl: '',
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

  return (
    <div className="page-col page-col-form">
      <h1>Support & Feedback</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Found a bug? Have a feature request? Let us know below. This is a private channel to the platform admins.
      </p>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            >
              <option value="bug">Report a Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Title *</label>
            <Input
              name="title"
              placeholder="Brief summary of the issue..."
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description *</label>
            <textarea
              name="description"
              placeholder="Please provide details..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}/>
              Where did this happen? (Optional)
            </label>
            <Input
              name="pageContext"
              placeholder="e.g., /resources page, or trying to login"
              value={formData.pageContext}
              onChange={handleChange}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              <Upload size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}/>
              Screenshot (Optional)
            </label>
            <Input
              id="screenshot-upload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleScreenshotUpload}
              disabled={isUploading || isSubmitting}
            />
            {isUploading && <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '5px' }}>Uploading screenshot...</div>}
            {formData.screenshotUrl && (
              <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '5px' }}>
                ✓ Screenshot attached
              </div>
            )}
          </div>
{/*
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '15px',
            backgroundColor: 'rgba(124, 106, 247, 0.05)',
            borderRadius: 'var(--radius)',
            border: '1px dashed var(--primary)'
          }}>
            <input
              type="checkbox"
              id="displayNamePublicly"
              name="displayNamePublicly"
              checked={formData.displayNamePublicly}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="displayNamePublicly" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <strong>Display my name publicly</strong> if this feature request/bug fix is published in a future changelog.
              <br/><span style={{ color: 'var(--text-muted)' }}>(Note: Platform admins can always see who submitted the ticket regardless of this toggle).</span>
            </label>
          </div> */}

          <div style={{ marginTop: '10px' }}>
            <Button type="submit" disabled={isSubmitting || isUploading} style={{ width: '100%' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Support;
