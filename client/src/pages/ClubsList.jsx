import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

import { SkeletonCard } from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { AlertTriangle, Users, Search, X } from 'lucide-react';

function ClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/clubs');
      setClubs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : clubs;

  const suggestions = query.trim().length >= 1 ? filtered.slice(0, 8) : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      );
    }
    if (error) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load clubs"
          message={error}
          action={{ label: 'Retry', onClick: fetchClubs }}
        />
      );
    }
    if (clubs.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No clubs yet"
          message="This is a community-driven platform — don't be shy to start. Let's grow this together."
        />
      );
    }
    return (
      <>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No clubs match your search"
            message="Try a different search term."
          />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map(club => (
              <Card key={club._id} lift style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(124,106,247,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}>
                  <Users size={18} color="var(--primary)" />
                </div>
                <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>{club.name}</h3>
                <p style={{ flexGrow: 1, marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {club.description}
                </p>
                <Link to={`/clubs/${club._id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" style={{ width: '100%' }}>View Club →</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Campus Clubs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Explore official clubs, society pages, and interest groups.
          </p>
        </div>

        {/* Search input with autocomplete */}
        <div ref={searchRef} style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <Input
              type="text"
              placeholder="Search clubs..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              style={{ paddingLeft: 36, paddingRight: query ? 36 : 12 }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setShowSuggestions(false); }}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', padding: 4,
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              marginTop: 4,
              overflow: 'hidden',
            }}>
              {suggestions.map(club => (
                <Link
                  key={club._id}
                  to={`/clubs/${club._id}`}
                  onClick={() => setShowSuggestions(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Users size={14} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{club.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{club.description?.slice(0, 60)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

export default ClubsList;
