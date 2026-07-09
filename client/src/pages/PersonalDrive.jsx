import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { Cloud, FileText, Image as ImageIcon, Video, File, Trash2, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function PersonalDrive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await axiosClient.get('/drive');
      setFiles(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load your private files');
      toast.error('Failed to load private files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      return toast.error('File size must be less than 20MB');
    }

    setUploading(true);
    try {
      // 1. Get presigned upload URL
      const { data } = await axiosClient.post('/drive/upload-url', {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream'
      });

      // 2. Upload to S3
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });

      // 3. Confirm with backend
      const confirmRes = await axiosClient.post('/drive/confirm', {
        key: data.key,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        size: file.size
      });

      setFiles([confirmRes.data, ...files]);
      toast.success('File uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const { data } = await axiosClient.get(`/drive/${fileId}/download`);
      
      // We open the presigned URL in a new tab or trigger a download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate download link');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file permanently?')) return;
    
    try {
      await axiosClient.delete(`/drive/${fileId}`);
      setFiles(files.filter(f => f._id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete file');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={24} color="var(--primary)" />;
    if (mimeType.startsWith('video/')) return <Video size={24} color="var(--danger)" />;
    if (mimeType.includes('pdf')) return <FileText size={24} color="var(--danger)" />;
    return <File size={24} color="var(--text-muted)" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cloud color="var(--primary)" />
              My Drive
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Private, secure personal file storage (Max 20MB per file)</p>
          </div>
          <div>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              disabled={uploading} 
            />
            <Button variant="primary" onClick={() => document.getElementById('file-upload').click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </div>

        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchFiles }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading ? (
          <Spinner text="Loading your files..." />
        ) : files.length === 0 ? (
          <EmptyState icon={Cloud} title="Your drive is empty" message="Upload files to keep them safe and accessible anywhere." />
        ) : (
          <div className="grid-auto-fill">
            {files.map(file => (
              <Card key={file._id} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.fileName}>
                      {file.fileName}
                    </h4>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>
                      {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <Button variant="outline" style={{ flex: 1, padding: '6px' }} onClick={() => handleDownload(file._id, file.fileName)}>
                    <Download size={16} />
                  </Button>
                  <Button variant="outline" style={{ flex: 1, padding: '6px', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }} onClick={() => handleDelete(file._id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonalDrive;
