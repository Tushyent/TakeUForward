import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import axios from 'axios';
import useDebounce from '../hooks/useDebounce';
import SearchFilterBar from '../components/SearchFilterBar';
import { useAuth } from '../context/auth-context';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import FilePreview from '../components/ui/FilePreview';
import { Search, AlertTriangle, Trash2, Upload } from 'lucide-react';

function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState({});
  const debouncedFilters = useDebounce(filters, 300);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(debouncedFilters).toString();
      const response = await axiosClient.get(`/resources?${queryParams}`);
      setResources(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

  const fetchBookmarks = React.useCallback(async () => {
    try {
      const response = await axiosClient.get('/bookmarks?type=resource');
      setBookmarkedIds(new Set(response.data.map(b => typeof b.itemId === 'object' ? b.itemId._id : b.itemId)));
    } catch (err) {
      console.error('Error fetching bookmarks', err);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchBookmarks();
  }, [fetchResources, fetchBookmarks]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !courseCode || !semester || !file) {
      toast.error('Please fill in all required fields and select a file.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get presigned URL
      const { data } = await axiosClient.post('/resources/upload-url', {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream'
      });

      const { uploadUrl, fileUrl } = data;

      // 2. Upload file directly to S3 (bypassing backend)
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      // 3. Save metadata to backend
      await axiosClient.post('/resources', {
        title,
        courseCode,
        semester: parseInt(semester, 10),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl
      });

      // Reset form
      setTitle('');
      setCourseCode('');
      setSemester('');
      setTags('');
      setFile(null);
      e.target.reset();

      toast.success('Resource uploaded successfully!');
      fetchResources();
    } catch (err) {
      console.error('Upload error', err);
      toast.error(err.response?.data?.error || 'Failed to upload resource');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBookmark = async (resourceId) => {
    try {
      await axiosClient.post('/bookmarks', { itemType: 'resource', itemId: resourceId });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (next.has(resourceId)) next.delete(resourceId);
        else next.add(resourceId);
        return next;
      });
      toast.success('Bookmark updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update bookmark');
    }
  };

  const handleDeleteResource = async (res) => {
    if (!window.confirm(`Delete resource "${res.title}"? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/resources/${res._id}`);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete resource');
    }
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'var(--text-secondary)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1>Academic Resources</h1>

        <Card className="card-resource" style={{ maxWidth: '600px', marginBottom: 'var(--space-6)' }}>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ marginTop: 0 }}>Upload a Resource</h3>
            
            <Input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Input type="text" placeholder="Course Code (e.g. CS101)" value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
            <Input type="number" placeholder="Semester (e.g. 1-8)" value={semester} onChange={e => setSemester(e.target.value)} required min="1" max="8" />
            <Input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={e => setFile(e.target.files[0])}
                required
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <Upload size={15} />
                {file ? file.name : 'Choose File...'}
              </Button>
            </div>

            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </form>
        </Card>
        
        <SearchFilterBar filters={filters} setFilters={setFilters} showType={false} showDept={false} showYear={false} />

        <h2 style={{ marginTop: '3rem' }}>Available Resources</h2>
        {loading ? (
          <Spinner text="Loading resources..." />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error"
            message={error}
            action={{ label: 'Retry', onClick: fetchResources }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          />
        ) : resources.length === 0 ? (
          <EmptyState icon={Search} title="No resources found" message="No resources match your current filters." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {resources.map((res) => (
              <Card className="card-resource" key={res._id} style={{ marginBottom: 0 }}>
                <p style={{ fontSize: '1.2em', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                  <strong>{res.title}</strong>
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <Badge variant="primary">{res.courseCode}</Badge>
                  <Badge variant="secondary">Semester {res.semester}</Badge>
                  {res.tags?.map((tag, idx) => (
                    <Badge key={`${tag}-${idx}`} variant="info">{tag}</Badge>
                  ))}
                </div>
                
                {res.aiSummary && (
                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '15px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.95em', color: 'var(--text-primary)', borderLeft: '3px solid var(--primary)' }}>
                    <strong>✨ AI Summary:</strong> {res.aiSummary}
                  </div>
                )}

                <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  Uploaded by: {res.uploaderId?.username ? (
                    <Link to={`/profile/${res.uploaderId.username}`} style={{ color: 'inherit', fontWeight: 500 }}>
                      {res.uploaderId.name} (@{res.uploaderId.handle})
                    </Link>
                  ) : (
                    res.uploaderId?.name || 'Unknown'
                  )}
                </p>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ width: '100%', maxWidth: '400px', marginBottom: '10px' }}>
                    <FilePreview fileUrl={res.fileUrl} fileName={res.title} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                    <Button variant="secondary" onClick={() => handleBookmark(res._id)} style={{ color: bookmarkedIds.has(res._id) ? 'var(--primary)' : 'inherit' }}>
                      {bookmarkedIds.has(res._id) ? '★ Saved' : '☆ Save'}
                    </Button>
                    {user && (user.isPlatformAdmin || user._id === (res.uploaderId?._id || res.uploaderId)) && (
                      <Button variant="danger" size="sm" onClick={() => handleDeleteResource(res)}>
                        <Trash2 size={13} /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Resources;
