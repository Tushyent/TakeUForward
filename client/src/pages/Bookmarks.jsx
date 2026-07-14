import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Bookmark as BookmarkIcon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import FilePreview from '../components/ui/FilePreview';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, post, resource

  const fetchBookmarks = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = filterType !== 'all' ? `?type=${filterType}` : '';
      const response = await axiosClient.get(`/bookmarks${query}`);
      setBookmarks(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleUnbookmark = async (itemType, itemId) => {
    try {
      await axiosClient.post('/bookmarks', { itemType, itemId });
      toast.success('Bookmark removed');
      fetchBookmarks(); // Refresh list
    } catch {
      toast.error('Failed to remove bookmark');
    }
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: '10px' }}>Saved</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Your personal tracker for posts and resources.</p>

        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant={filterType === 'all' ? 'primary' : 'secondary'} onClick={() => setFilterType('all')}>All</Button>
          <Button variant={filterType === 'post' ? 'primary' : 'secondary'} onClick={() => setFilterType('post')}>Posts</Button>
          <Button variant={filterType === 'resource' ? 'primary' : 'secondary'} onClick={() => setFilterType('resource')}>Resources</Button>
          {/* <Button variant={filterType === 'interview_experience' ? 'primary' : 'secondary'} onClick={() => setFilterType('interview_experience')}>Interviews</Button> */}
          {/* <Button variant={filterType === 'elective_suggestion' ? 'primary' : 'secondary'} onClick={() => setFilterType('elective_suggestion')}>Electives</Button> */}
        </div>

        {loading ? (
          <Spinner text="Loading saved items..." />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error"
            message={error}
            action={{ label: 'Retry', onClick: fetchBookmarks }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          />
        ) : bookmarks.length === 0 ? (
          <EmptyState icon={BookmarkIcon} title="No saved items yet" message="Start saving posts and resources!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {bookmarks.map(bookmark => {
              const item = bookmark.itemId;
              if (!item) return null;

              if (bookmark.itemType === 'post') {
                return (
                  <Card key={bookmark._id} style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge variant="primary" style={{ marginBottom: '10px' }}>Post</Badge>
                      <Button variant="secondary" onClick={() => handleUnbookmark('post', item._id)} style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary)' }}>
                        ★ Saved
                      </Button>
                    </div>
                    <p style={{ fontSize: '1.1em', marginBottom: '10px', color: 'var(--text-primary)' }}>
                      {item.content}
                    </p>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {item.type === 'announcement' && item.clubId ? (
                        <span>📢 Announcement by {item.clubId.name}</span>
                      ) : (
                        <span>
                          By: {item.isAnonymous ? 'Anonymous' : (
                            <Link to={`/profile/${item.authorId?.username}`} style={{ color: 'inherit', fontWeight: 500 }}>
                              {item.authorId?.name || 'Unknown'} (@{item.authorId?.handle || 'unknown'})
                            </Link>
                          )}
                        </span>
                      )}
                      <span>• {new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </Card>
                );
              }

              if (bookmark.itemType === 'resource') {
                return (
                  <Card key={bookmark._id} style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge variant="success" style={{ marginBottom: '10px' }}>Resource</Badge>
                      <Button variant="secondary" onClick={() => handleUnbookmark('resource', item._id)} style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary)' }}>
                        ★ Saved
                      </Button>
                    </div>
                    <p style={{ fontSize: '1.2em', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                      <strong>{item.title}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{item.courseCode}</Badge>
                      <Badge variant="secondary">Semester {item.semester}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '100%', maxWidth: '400px' }}>
                        <FilePreview fileUrl={item.fileUrl} fileName={item.title} />
                      </div>
                    </div>
                  </Card>
                );
              }

              if (bookmark.itemType === 'interview_experience') {
                return (
                  <Card key={bookmark._id} style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge variant="warning" style={{ marginBottom: '10px' }}>Interview</Badge>
                      <Button variant="secondary" onClick={() => handleUnbookmark('interview_experience', item._id)} style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary)' }}>
                        ★ Saved
                      </Button>
                    </div>
                    <p style={{ fontSize: '1.2em', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                      <strong>{item.company}</strong> - {item.role} ({item.status})
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <Badge variant="secondary">Batch {item.batchYear}</Badge>
                      <Badge variant="outline">{item.difficulty}</Badge>
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                      By: {item.isAnonymous ? 'Anonymous' : (
                        <Link to={`/profile/${item.authorId?.username}`} style={{ color: 'inherit', fontWeight: 500 }}>
                          {item.authorId?.name || 'Unknown'}
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              }

              if (bookmark.itemType === 'elective_suggestion') {
                return (
                  <Card key={bookmark._id} style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge variant="primary" style={{ marginBottom: '10px' }}>Elective</Badge>
                      <Button variant="secondary" onClick={() => handleUnbookmark('elective_suggestion', item._id)} style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary)' }}>
                        ★ Saved
                      </Button>
                    </div>
                    <p style={{ fontSize: '1.2em', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                      <strong>{item.courseCode} - {item.courseName}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <Badge variant="secondary">Dept {item.department}</Badge>
                      <Badge variant="outline">Difficulty: {item.difficulty}/5</Badge>
                    </div>
                  </Card>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookmarks;
