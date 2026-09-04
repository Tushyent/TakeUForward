import React, { useEffect, useState, useCallback } from 'react';
import { History, RefreshCcw, Trash2, Plus, Edit2, AlertTriangle, ShieldAlert, Calendar, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useDebounce from '../hooks/useDebounce';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/admin/activity?${new URLSearchParams({ q: query, limit: '100' })}`);
      setLogs(res.data.logs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const getLogIcon = (action) => {
    switch (action) {
      case 'create':
        return <Plus size={14} />;
      case 'delete':
        return <Trash2 size={14} />;
      case 'update':
      case 'approve':
        return <Edit2 size={14} />;
      case 'report':
        return <AlertTriangle size={14} />;
      default:
        return <ShieldAlert size={14} />;
    }
  };

  const getLogIconColor = (action) => {
    switch (action) {
      case 'create':
        return { bg: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)', border: 'color-mix(in srgb, var(--success) 22%, transparent)' };
      case 'delete':
        return { bg: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 22%, transparent)' };
      case 'report':
        return { bg: 'color-mix(in srgb, var(--warning) 10%, transparent)', color: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 22%, transparent)' };
      default:
        return { bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)', border: 'color-mix(in srgb, var(--primary) 22%, transparent)' };
    }
  };

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        
        {/* --- Header Section --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}>
                <History size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Activity Log
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              Audited historical record of administrative and user actions across the platform.
            </p>
          </div>
          <Button variant="secondary" onClick={loadLogs} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCcw size={14} /> Refresh Logs
          </Button>
        </div>

        {/* --- Filter Search Bar --- */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <Search size={14} />
          </div>
          <Input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search by action, resource, or user..." 
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        {/* --- Logs List --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {loading ? (
            <Spinner text="Loading audited events..." />
          ) : logs.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No audit logs recorded matching your search.</p>
            </Card>
          ) : (
            logs.map(log => {
              const styles = getLogIconColor(log.action);
              return (
                <div 
                  key={log._id} 
                  style={{
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{
                    width: 32, 
                    height: 32, 
                    borderRadius: 'var(--radius-md)', 
                    flexShrink: 0,
                    background: styles.bg,
                    border: `1px solid ${styles.border}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: styles.color,
                  }}>
                    {getLogIcon(log.action)}
                  </div>
                  
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{log.userName}</span>
                      <Badge variant={log.action === 'delete' ? 'danger' : log.action === 'create' ? 'success' : 'secondary'} size="sm">
                        {log.action}
                      </Badge>
                      <Badge variant="info" size="sm">{log.resource}</Badge>
                    </div>
                    
                    <p style={{ margin: '0 0 6px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {log.description}
                    </p>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre style={{ 
                        margin: '0 0 6px 0', 
                        padding: 'var(--space-2) var(--space-3)', 
                        background: 'var(--bg-elevated)', 
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-xs)', 
                        color: 'var(--text-muted)', 
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      <Calendar size={12} />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
