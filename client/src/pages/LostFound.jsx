import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import axiosClient from '../api/axiosClient';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Search, AlertCircle, MessageCircle, Calendar, MapPin, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

function LostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const debouncedSearch = useDebounce(filterSearch, 300);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    itemName: '',
    description: '',
    locationTag: '',
    contactPreference: 'Message me via app',
    whatsappNumber: '',
    dateLostFound: new Date().toISOString().split('T')[0],
    imageUrl: '',
    proofRequired: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const { user: currentUser } = useAuth();

  const fetchItems = async (isNewPage = false) => {
    try {
      if (isNewPage) setLoadingMore(true);
      const params = new URLSearchParams({
        page: isNewPage ? page : 1,
        limit: 10
      });
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (filterLocation) params.append('locationTag', filterLocation);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await axiosClient.get(`/lost-found?${params.toString()}`);
      if (res.data.length < 10) setHasMore(false);
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
  }, [filterType, filterStatus, filterLocation, debouncedSearch]); // eslint-disable-line

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
        contactPreference: 'Message me via app',
        whatsappNumber: '',
        dateLostFound: new Date().toISOString().split('T')[0],
        imageUrl: '',
        proofRequired: ''
      });
      toast.success('Item posted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post item');
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
      console.error(err);
      toast.error('Failed to resolve item');
    }
  };

  const navigate = useNavigate();

  const handleMessageUser = async (userId) => {
    try {
      const res = await axiosClient.get(`/chats/${userId}`);
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to start chat');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Only images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    setUploadingImage(true);
    try {
      const { data } = await axiosClient.post('/lost-found/upload-url', {
        fileName: file.name,
        fileType: file.type
      });

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      setFormData({ ...formData, imageUrl: data.fileUrl });
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
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

              <div className="grid-2-col">
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Location (Free text)</label>
                  <Input value={formData.locationTag} onChange={e => setFormData({ ...formData, locationTag: e.target.value })} placeholder="e.g., Library 2nd Floor, Main Canteen" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Date {formData.type === 'lost' ? 'Lost' : 'Found'}</label>
                  <Input type="date" value={formData.dateLostFound} onChange={e => setFormData({ ...formData, dateLostFound: e.target.value })} required />
                </div>
              </div>

              <div className="grid-2-col">
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Contact Preference</label>
                  <Input value={formData.contactPreference} onChange={e => setFormData({ ...formData, contactPreference: e.target.value })} placeholder="e.g., Message me via app" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>WhatsApp Number (Optional)</label>
                  <Input type="tel" value={formData.whatsappNumber} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} placeholder="e.g., 9876543210" />
                </div>
              </div>

              <div className="grid-2-col">
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Upload Image (Optional)</label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  {uploadingImage && <span style={{ fontSize: '0.8em', color: 'var(--primary)' }}>Uploading...</span>}
                  {formData.imageUrl && <span style={{ fontSize: '0.8em', color: 'var(--success)' }}>✓ Image uploaded</span>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Proof Required (Optional)</label>
                  <Input 
                    value={formData.proofRequired} 
                    onChange={e => setFormData({ ...formData, proofRequired: e.target.value })} 
                    placeholder="e.g., Describe the wallpaper on the phone to claim" 
                  />
                </div>
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
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
            <Input
              value={filterSearch}
              onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
              placeholder="Search items..."
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
          <Select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
            <option value="">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </Select>
          <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Input
            placeholder="Filter location..."
            value={filterLocation}
            onChange={e => { setFilterLocation(e.target.value); setPage(1); }}
            style={{ minWidth: 160, width: 'auto' }}
          />
        </div>

        {/* Items List */}
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: () => fetchItems(false) }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading && page === 1 ? (
          <Spinner text="Loading items..." />
        ) : items.length === 0 ? (
          <EmptyState icon={Search} title="No Items Found" message="There are currently no lost or found items matching your criteria. Be the first to post one!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items.map((item) => (
              <Card key={item._id} style={{ opacity: item.status === 'resolved' ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.75em', 
                        fontWeight: '700',
                        backgroundColor: item.type === 'lost' ? 'var(--danger-bg)' : 'var(--success-bg)',
                        color: item.type === 'lost' ? 'var(--danger)' : 'var(--success)',
                        border: `1px solid ${item.type === 'lost' ? 'var(--danger)' : 'var(--success)'}`
                      }}>
                        {item.type.toUpperCase()}
                      </span>
                      {item.status === 'resolved' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85em', fontWeight: 600 }}>[RESOLVED]</span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{item.itemName}</h3>
                    <p style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</p>
                    
                    {item.imageUrl && (
                      <div style={{ marginBottom: '15px', maxWidth: '300px' }}>
                        <img src={item.imageUrl} alt="Lost item" style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                      </div>
                    )}

                    {item.proofRequired && (
                      <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '0.9em' }}>
                        <strong>Proof Required to Claim:</strong> {item.proofRequired}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> <strong>Location:</strong> {item.locationTag}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14}/> <strong>Date {item.type === 'lost' ? 'Lost' : 'Found'}:</strong> {item.dateLostFound ? new Date(item.dateLostFound).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14}/> <strong>Posted by:</strong> {item.authorId?.name} ({item.authorId?.dept})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> <strong>Posted on:</strong> {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                    {currentUser && item.authorId && currentUser._id !== item.authorId._id && item.status === 'open' && (
                      <>
                        <Button variant="primary" onClick={() => handleMessageUser(item.authorId._id)} style={{ width: '100%' }}>
                          Message in App
                        </Button>
                        {item.whatsappNumber && (
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(`https://wa.me/91${item.whatsappNumber.replace(/\D/g, '')}?text=Hi, I am messaging regarding your ${item.type} item: ${item.itemName} on TakeUForward.`, '_blank')}
                            style={{ width: '100%', borderColor: '#25D366', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <MessageCircle size={16} /> WhatsApp
                          </Button>
                        )}
                      </>
                    )}
                    
                    {currentUser && item.authorId && currentUser._id === item.authorId._id && item.status === 'open' && (
                      <Button variant="outline" onClick={() => handleResolve(item._id)} style={{ width: '100%' }}>
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {hasMore && (
              <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={loadingMore} style={{ alignSelf: 'center' }}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LostFound;
