import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import axios from 'axios';

function Resources() {
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  
  const [filterCourseCode, setFilterCourseCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchResources = React.useCallback(async () => {
    try {
      const url = filterCourseCode ? `/resources?courseCode=${filterCourseCode}` : '/resources';
      const response = await axiosClient.get(url);
      setResources(response.data);
    } catch (err) {
      console.error('Error fetching resources', err);
    }
  }, [filterCourseCode]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !courseCode || !semester || !file) {
      setError('Please fill in all required fields and select a file.');
      return;
    }

    setLoading(true);
    setError('');

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

      fetchResources();
    } catch (err) {
      console.error('Upload error', err);
      setError('Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/home">← Back to Home</Link>
      <h1>Academic Resources</h1>

      <hr />

      <form onSubmit={handleUpload} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <h3>Upload a Resource</h3>
        
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <input type="text" placeholder="Course Code (e.g. CS101)" value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
        <input type="number" placeholder="Semester (e.g. 1-8)" value={semester} onChange={e => setSemester(e.target.value)} required min="1" max="8" />
        <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
        
        <input type="file" onChange={e => setFile(e.target.files[0])} required />

        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <hr />

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Filter by Course Code..." 
          value={filterCourseCode}
          onChange={e => setFilterCourseCode(e.target.value)}
          style={{ padding: '5px' }}
        />
      </div>

      <h2>Available Resources</h2>
      {resources.length === 0 ? <p>No resources found.</p> : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {resources.map((res) => (
            <li key={res._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>{res.title}</strong> ({res.courseCode}, Sem {res.semester})</p>
              <small>
                Uploaded by: {res.uploaderId?.name || 'Unknown'} 
                {' | '} 
                Tags: {res.tags?.join(', ') || 'None'}
              </small>
              <br />
              <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px' }}>
                Download / View File
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Resources;
