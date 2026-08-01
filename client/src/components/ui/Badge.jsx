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
    primary:   { background: 'rgba(99,102,241,0.14)',  color: '#A5B4FC',              borderColor: 'rgba(99,102,241,0.28)' },
    secondary: { background: 'var(--bg-elevated)',      color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' },
    accent:    { background: 'var(--accent-bg)',        color: 'var(--accent)',         borderColor: 'var(--accent-border)' },
    danger:    { background: 'var(--danger-bg)',        color: 'var(--danger)',         borderColor: 'rgba(244,63,94,0.30)' },
    success:   { background: 'var(--success-bg)',       color: 'var(--success)',        borderColor: 'rgba(16,185,129,0.30)' },
    warning:   { background: 'var(--warning-bg)',       color: 'var(--warning)',        borderColor: 'rgba(245,158,11,0.30)' },
    info:      { background: 'var(--info-bg)',          color: 'var(--info)',           borderColor: 'rgba(56,189,248,0.30)' },
  };

  return (
    <span style={{ ...baseStyle, ...(variants[variant] || variants.primary) }}>
      {children}
    </span>
  );
};

export default Badge;
