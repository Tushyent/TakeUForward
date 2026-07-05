import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, post, resource

  const fetchBookmarks = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = filterType !== 'all' ? `?type=${filterType}` : '';
      const response = await axiosClient.get(`/bookmarks${query}`);
      setBookmarks(response.data);
    } catch (_) {
      console.error('Error fetching bookmarks');
      toast.error('Failed to load bookmarks');
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
    } catch (_) {
      toast.error('Failed to remove bookmark');
    }
  };

  return (
    <div className="page-transition">
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px' }}>My Saved Items</h1>
        <p style={{ color: 'var(--text)', marginBottom: '20px' }}>Your personal tracker for posts and resources.</p>

        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
          <Button variant={filterType === 'all' ? 'primary' : 'secondary'} onClick={() => setFilterType('all')}>All</Button>
          <Button variant={filterType === 'post' ? 'primary' : 'secondary'} onClick={() => setFilterType('post')}>Posts</Button>
          <Button variant={filterType === 'resource' ? 'primary' : 'secondary'} onClick={() => setFilterType('resource')}>Resources</Button>
        </div>

        {loading ? (
          <Spinner text="Loading your bookmarks..." />
        ) : bookmarks.length === 0 ? (
          <EmptyState icon={BookmarkIcon} message="No saved items found. Start bookmarking posts and resources!" />
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
                    <p style={{ fontSize: '1.1em', marginBottom: '10px', color: 'var(--text-h)' }}>
                      {item.content}
                    </p>
                    <div style={{ fontSize: '0.85em', color: 'var(--text)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
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
                    <p style={{ fontSize: '1.2em', margin: '0 0 10px 0', color: 'var(--text-h)' }}>
                      <strong>{item.title}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{item.courseCode}</Badge>
                      <Badge variant="secondary">Semester {item.semester}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary">Download / View File</Button>
                      </a>
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
