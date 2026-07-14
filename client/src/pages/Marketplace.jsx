import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import axiosClient from '../api/axiosClient';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ReportModal from '../components/ui/ReportModal';
import Badge from '../components/ui/Badge';
import { Store, AlertCircle, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('available');
  const [filterSearch, setFilterSearch] = useState('');
  const debouncedSearch = useDebounce(filterSearch, 300);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'book',
    price: '',
    condition: 'good'
  });

  const { user: currentUser } = useAuth();

  const fetchItems = async (isNewPage = false) => {
    try {
      if (isNewPage) setLoadingMore(true);
      const params = new URLSearchParams({
        page: isNewPage ? page : 1,
        limit: 12
      });
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await axiosClient.get(`/marketplace?${params.toString()}`);
      if (res.data.length < 12) setHasMore(false);
      else setHasMore(true);

      if (isNewPage) {
        setItems(prev => [...prev, ...res.data]);
      } else {
        setItems(res.data);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load items');
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [filterCategory, filterStatus, debouncedSearch]); // eslint-disable-line

  useEffect(() => {
    if (page > 1) {
      fetchItems(true);
    }
  }, [page]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/marketplace', formData);
      setItems([res.data, ...items]);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'book',
        price: '',
        condition: 'good'
      });
      toast.success('Item posted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = (id) => {
    setReportingId(id);
  };

  const submitReport = async (reason) => {
    await axiosClient.post(`/marketplace/${reportingId}/report`, { reason });
    toast.success('Item reported successfully');
  };

  const handleMarkSold = async (id) => {
    if (!window.confirm('Mark this item as sold?')) return;
    try {
      const res = await axiosClient.patch(`/marketplace/${id}/sold`);
      setItems(prev => prev.map(item => item._id === id ? res.data : item));
      toast.success('Item marked as sold');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark item as sold');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axiosClient.delete(`/marketplace/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      toast.success('Item deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete item');
    }
  };

  // Message navigation uses <Link to={`/chat/${userId}`}> inline below

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Buy &amp; Sell</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Post an Item'}
          </Button>
        </div>

        {showForm && (
          <Card style={{ marginBottom: '30px', borderColor: 'var(--primary)' }}>
            <h2 style={{ marginTop: 0 }}>List an Item for Sale</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="e.g., Engineering Mathematics Book" 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Price (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    placeholder="0 for free" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Category</label>
                  <Select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                    <option value="book">Book</option>
                    <option value="cycle">Cycle</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Condition</label>
                  <Select value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} required>
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </Select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Provide details about the item..." 
                  style={{ width: '100%', minHeight: '80px' }}
                  required 
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Item'}
              </Button>
            </form>
          </Card>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <Input
              value={filterSearch}
              onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
              placeholder="Search items..."
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
          <Select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All Categories</option>
            <option value="book">Books</option>
            <option value="cycle">Cycles</option>
            <option value="electronics">Electronics</option>
            <option value="other">Other</option>
          </Select>
          <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </Select>
        </div>

        {/* Items Grid */}
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: () => fetchItems(false) }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading && page === 1 ? (
          <Spinner text="Loading marketplace..." />
        ) : items.length === 0 ? (
          <EmptyState icon={Store} message="No items found." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {items.map((item) => (
              <Card key={item._id} style={{ opacity: item.status === 'sold' ? 0.7 : 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0', color: 'var(--text-primary)' }}>{item.title}</h3>
                  <Badge variant={item.status === 'available' ? (item.price === 0 ? 'success' : 'primary') : 'secondary'}>
                    {item.status === 'sold' ? 'SOLD' : (item.price === 0 ? 'FREE' : `₹${item.price}`)}
                  </Badge>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <Badge variant="info">{item.category}</Badge>
                  <Badge variant="secondary">Condition: {item.condition.replace('_', ' ')}</Badge>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', flexGrow: 1, whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
                  {item.description}
                </p>

                <p style={{ margin: '0 0 15px 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                  Posted by {item.sellerId?.username ? (
                    <Link to={`/profile/${item.sellerId.username}`} style={{ color: 'inherit', fontWeight: 500 }}>
                      {item.sellerId.name} (@{item.sellerId.handle})
                    </Link>
                  ) : (
                    item.sellerId?.name || 'Unknown'
                  )} • {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                  {currentUser && item.sellerId && currentUser._id !== item.sellerId._id && item.status === 'available' && (
                    <Button
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/chat/${item.sellerId._id}`)}
                    >
                      Message Seller
                    </Button>
                  )}
                  
                  {currentUser && item.sellerId && currentUser._id === item.sellerId._id && item.status === 'available' && (
                    <Button variant="success" onClick={() => handleMarkSold(item._id)} style={{ flex: 1 }}>
                      Mark as Sold
                    </Button>
                  )}

                  {currentUser && item.sellerId && currentUser._id !== item.sellerId._id && (
                    <Button variant="secondary" onClick={() => handleReport(item._id)}>
                      ⚑
                    </Button>
                  )}

                  {currentUser && (currentUser.isPlatformAdmin || currentUser._id === (item.sellerId?._id || item.sellerId)) && (
                    <Button variant="danger" onClick={() => handleDeleteItem(item._id)} style={{ padding: '0 12px' }}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {hasMore && !loading && items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={!!reportingId}
        onClose={() => setReportingId(null)}
        onSubmit={submitReport}
        title="Report Item"
        placeholder="Please describe why you are reporting this item:"
      />
    </div>
  );
}

export default Marketplace;
