import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  message = "Nothing to see here.",
  style = {}
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1rem',
      color: 'var(--text)',
      background: 'var(--code-bg)',
      borderRadius: 'var(--radius-card, 12px)',
      border: '1px dashed var(--border)',
      margin: '1rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      ...style
    }}>
      <Icon size={48} style={{ opacity: 0.3 }} />
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{message}</p>
    </div>
  );
};

export default EmptyState;
