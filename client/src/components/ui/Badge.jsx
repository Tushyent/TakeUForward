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
    danger: { background: 'rgba(220, 53, 69, 0.1)', color: 'var(--danger)' },
    success: { background: 'rgba(40, 167, 69, 0.1)', color: 'var(--success)' },
    info: { background: 'rgba(0, 123, 255, 0.1)', color: '#007BFF' }
  };

  return (
    <span style={{ ...baseStyle, ...variants[variant] }}>
      {children}
    </span>
  );
};

export default Badge;
