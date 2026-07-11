import React, { useState } from 'react';
import { Upload, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
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
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0 }}>Support & Feedback</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)' }}>
          Found a bug? Have a feature request? This is a private channel to the platform admins.
        </p>
      </div>

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
            <Input
              id="screenshot-upload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleScreenshotUpload}
              disabled={isUploading || isSubmitting}
              style={{ width: '100%' }}
            />
            {isUploading && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', marginTop: 'var(--space-2)' }}>
                Uploading screenshot...
              </div>
            )}
            {formData.screenshotUrl && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                ✓ Screenshot attached
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
    </div>
  );
};

export default Support;
