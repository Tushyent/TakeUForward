import React, { useEffect, useState, useCallback } from 'react';
import { History, RefreshCcw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useDebounce from '../hooks/useDebounce';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
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

  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={22} /> Activity Log
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Every user and admin action across the platform - visible to admins only.
            </p>
          </div>
          <Button variant="secondary" onClick={loadLogs}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', maxWidth: 400 }}>
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by action, resource, or user..." />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {loading ? (
            <Spinner text="Loading activity log..." />
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>No activity recorded yet.</p>
          ) : logs.map(log => (
            <div key={log._id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: log.action === 'delete' ? 'var(--danger-bg, rgba(239,68,68,0.1))' :
                  log.action === 'create' ? 'var(--success-bg, rgba(34,197,94,0.1))' :
                    log.action === 'report' ? 'var(--warning-bg, rgba(234,179,8,0.1))' :
                      'var(--bg-input)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                color: log.action === 'delete' ? 'var(--danger)' :
                  log.action === 'create' ? 'var(--success)' :
                    log.action === 'report' ? 'var(--warning)' :
                      'var(--text-secondary)',
              }}>
                {log.action === 'create' ? '+' : log.action === 'delete' ? '×' : log.action === 'update' ? '~' : '•'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>{log.userName}</strong>
                  <Badge variant="secondary" size="sm">{log.action}</Badge>
                  <Badge variant="info" size="sm">{log.resource}</Badge>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                  {log.description}
                </p>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {JSON.stringify(log.details).slice(0, 120)}
                  </p>
                )}
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
