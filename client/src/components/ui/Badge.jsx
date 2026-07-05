import React from 'react';

const Badge = ({ children, variant = 'primary', style }) => {
  const baseStyle = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...style
  };

  const variants = {
    primary: { background: 'var(--accent-bg)', color: 'var(--accent)' },
    secondary: { background: 'var(--border)', color: 'var(--text-h)' },
    danger: { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' },
    success: { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' },
    info: { background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }
  };

  return (
    <span style={{ ...baseStyle, ...variants[variant] }}>
      {children}
    </span>
  );
};

export default Badge;
