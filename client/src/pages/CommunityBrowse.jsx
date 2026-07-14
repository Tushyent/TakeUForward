import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Hash, Search, X, ChevronRight } from 'lucide-react';
import { SkeletonCard } from '../components/ui/Spinner';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const communityVariant = (type) => {
  const map = { dept: 'primary', batch: 'info', general: 'success', topic: 'accent' };
  return map[type] || 'secondary';
};

function CommunityBrowse() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axiosClient.get('/communities');
        setCommunities(res.data);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? communities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : communities;

  const suggestions = query.trim().length >= 1 ? filtered.slice(0, 10) : [];

  const groupedCommunities = filtered.reduce((acc, comm) => {
    if (comm.type === 'general' || comm.type === 'topic') {
      if (!acc['General & Topics']) acc['General & Topics'] = [];
      acc['General & Topics'].push(comm);
    } else if (comm.type === 'batch') {
      const yearMatch = comm.name.match(/'(\d{2})$/);
      if (yearMatch) {
        const year = `20${yearMatch[1]} Batch`;
        if (!acc[year]) acc[year] = [];
        acc[year].push(comm);
      } else {
        if (!acc['Other Batches']) acc['Other Batches'] = [];
        acc['Other Batches'].push(comm);
      }
    } else {
      if (!acc['Other']) acc['Other'] = [];
      acc['Other'].push(comm);
    }
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedCommunities).sort((a, b) => {
    if (a === 'General & Topics') return -1;
    if (b === 'General & Topics') return 1;
    if (a === 'Other Batches' || a === 'Other') return 1;
    if (b === 'Other Batches' || b === 'Other') return -1;
    return b.localeCompare(a); // Descending year (e.g. 2029 Batch, 2028 Batch)
  });

  useEffect(() => {
    if (!loading && openGroup === null && sortedGroupKeys.length > 0) {
      setOpenGroup(sortedGroupKeys[0]);
    }
  }, [loading, sortedGroupKeys, openGroup]);

  if (loading) {
    return (
      <div className="page-transition">
        <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>All Communities</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
          Browse department batches, topic communities, and general spaces.
        </p>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <Input
              type="text"
              placeholder="Search communities..."
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
              {suggestions.map(comm => (
                <Link
                  key={comm._id}
                  to={`/community/${comm._id}`}
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
                  <Hash size={14} color="var(--primary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{comm.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{comm.description?.slice(0, 80)}</div>
                  </div>
                  <Badge variant={communityVariant(comm.type)} size="sm">{comm.type}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No communities match your search"
            message="Try a different term."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {sortedGroupKeys.map(groupKey => (
              <div key={groupKey} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-main)' }}>
                <div 
                  onClick={() => setOpenGroup(openGroup === groupKey ? null : groupKey)}
                  style={{
                    padding: 'var(--space-4) var(--space-5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: openGroup === groupKey ? 'var(--bg-elevated)' : 'transparent',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {groupKey} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'var(--space-2)' }}>({groupedCommunities[groupKey].length})</span>
                  </h2>
                  <div style={{ transform: openGroup === groupKey ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease-in-out' }}>
                    <ChevronRight size={20} color="var(--text-muted)" />
                  </div>
                </div>
                
                {openGroup === groupKey && (
                  <div style={{ padding: 'var(--space-5)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                      {groupedCommunities[groupKey].map(comm => (
                        <Link
                          key={comm._id}
                          to={`/community/${comm._id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all var(--transition-fast)',
                            cursor: 'pointer',
                            height: '100%',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(124,106,247,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <Hash size={14} color="var(--primary)" />
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{comm.name}</p>
                                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{comm.description}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
                              <Badge variant={communityVariant(comm.type)} size="sm">{comm.type}</Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityBrowse;
