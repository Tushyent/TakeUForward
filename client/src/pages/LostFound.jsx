import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

function LostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterLocation, setFilterLocation] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    itemName: '',
    description: '',
    locationTag: '',
    contactPreference: 'Message me via app'
  });

  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  const fetchItems = async (isNewPage = false) => {
    try {
      const params = new URLSearchParams({
        page: isNewPage ? page : 1,
        limit: 10
      });
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (filterLocation) params.append('locationTag', filterLocation);

      const res = await axiosClient.get(`/lost-found?${params.toString()}`);
      if (res.data.length < 10) setHasMore(false);
      else setHasMore(true);

      if (isNewPage) {
        setItems(prev => [...prev, ...res.data]);
      } else {
        setItems(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [filterType, filterStatus, filterLocation]); // eslint-disable-line

  useEffect(() => {
    if (page > 1) {
      fetchItems(true);
    }
  }, [page]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/lost-found', formData);
      setItems([res.data, ...items]);
      setShowForm(false);
      setFormData({
        type: 'lost',
        itemName: '',
        description: '',
        locationTag: '',
        contactPreference: 'Message me via app'
      });
      toast.success('Item posted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to post item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await axiosClient.post(`/lost-found/${id}/resolve`);
      setItems(items.map(item => item._id === id ? res.data : item));
      toast.success('Marked as resolved');
    } catch (err) {
      toast.error('Failed to resolve item');
    }
  };

  const handleMessageUser = async (userId) => {
    try {
      const res = await axiosClient.post(`/chats`, { participantId: userId });
      // Redirect to chat
      window.location.href = `/chat/${res.data._id}`;
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  return (
    <div className="page-transition">
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Lost & Found Board</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Post an Item'}
          </Button>
        </div>

        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Post a Lost or Found Item</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Type</label>
                <Select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required>
                  <option value="lost">Lost an item</option>
                  <option value="found">Found an item</option>
                </Select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Item Name</label>
                <Input value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} placeholder="e.g., Blue Casio Calculator" required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Provide details like color, brand, distinct marks..." 
                  style={{ width: '100%', minHeight: '80px' }}
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Location (Free text)</label>
                <Input value={formData.locationTag} onChange={e => setFormData({ ...formData, locationTag: e.target.value })} placeholder="e.g., Library 2nd Floor, Main Canteen" required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Contact Preference</label>
                <Input value={formData.contactPreference} onChange={e => setFormData({ ...formData, contactPreference: e.target.value })} placeholder="e.g., Message me via app" />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Item'}
              </Button>
            </form>
          </Card>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </Select>
          <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Input 
            placeholder="Search location..." 
            value={filterLocation} 
            onChange={e => { setFilterLocation(e.target.value); setPage(1); }} 
            style={{ minWidth: '200px' }}
          />
        </div>

        {/* Items List */}
        {loading && page === 1 ? (
          <Spinner text="Loading items..." />
        ) : items.length === 0 ? (
          <EmptyState icon={Search} message="No items found." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items.map((item) => (
              <Card key={item._id} style={{ opacity: item.status === 'resolved' ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8em', 
                      fontWeight: 'bold',
                      backgroundColor: item.type === 'lost' ? '#ff4d4f' : '#52c41a',
                      color: 'white',
                      marginBottom: '10px'
                    }}>
                      {item.type.toUpperCase()}
                    </span>
                    {item.status === 'resolved' && (
                      <span style={{ marginLeft: '10px', color: 'var(--text)', fontSize: '0.85em', fontWeight: 600 }}>[RESOLVED]</span>
                    )}
                    <h3 style={{ margin: '0 0 10px 0' }}>{item.itemName}</h3>
                    <p style={{ margin: '0 0 10px 0', color: 'var(--text)' }}>{item.description}</p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>
                      <strong>Location:</strong> {item.locationTag}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>
                      <strong>Posted by:</strong> {item.authorId?.name} ({item.authorId?.dept})
                    </p>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--text)' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentUser && item.authorId && currentUser.id !== item.authorId._id && item.status === 'open' && (
                      <Button variant="outline" onClick={() => handleMessageUser(item.authorId._id)}>
                        Message {item.authorId.name.split(' ')[0]}
                      </Button>
                    )}
                    
                    {currentUser && item.authorId && currentUser.id === item.authorId._id && item.status === 'open' && (
                      <Button variant="outline" onClick={() => handleResolve(item._id)}>
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {hasMore && (
              <Button variant="outline" onClick={() => setPage(p => p + 1)} style={{ alignSelf: 'center' }}>
                Load More
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LostFound;
