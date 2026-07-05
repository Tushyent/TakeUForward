import React from 'react';

/**
 * Badge — inline status/label pill.
 * Variants: primary | secondary | accent | danger | success | warning | info
 * Size: sm | md
 */
const Badge = ({ children, variant = 'primary', size = 'md', style }) => {
  const sizeStyles = {
    sm: { padding: '2px 6px', fontSize: '10px' },
    md: { padding: '3px 10px', fontSize: 'var(--text-xs)' },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: '1px solid transparent',
    ...sizeStyles[size],
    ...style,
  };

  const variants = {
    primary:   { background: 'rgba(124,106,247,0.15)', color: 'var(--primary)',   borderColor: 'rgba(124,106,247,0.30)' },
    secondary: { background: 'var(--bg-elevated)',      color: 'var(--text-secondary)', borderColor: 'var(--border)' },
    accent:    { background: 'var(--accent-bg)',        color: 'var(--accent)',    borderColor: 'var(--accent-border)' },
    danger:    { background: 'var(--danger-bg)',        color: 'var(--danger)',    borderColor: 'rgba(248,113,113,0.30)' },
    success:   { background: 'var(--success-bg)',       color: 'var(--success)',   borderColor: 'rgba(52,211,153,0.30)' },
    warning:   { background: 'var(--warning-bg)',       color: 'var(--warning)',   borderColor: 'rgba(251,191,36,0.30)' },
    info:      { background: 'var(--info-bg)',          color: 'var(--info)',      borderColor: 'rgba(96,165,250,0.30)' },
  };

  return (
    <span style={{ ...baseStyle, ...(variants[variant] || variants.primary) }}>
      {children}
    </span>
  );
};

export default Badge;
