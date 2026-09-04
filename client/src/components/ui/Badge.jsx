import React from 'react';

/**
 * Badge - inline status/label pill.
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
    primary: { background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', borderColor: 'color-mix(in srgb, var(--primary) 28%, transparent)' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' },
    accent: { background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-border)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'color-mix(in srgb, var(--success) 28%, transparent)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'color-mix(in srgb, var(--warning) 28%, transparent)' },
    info: { background: 'var(--info-bg)', color: 'var(--info)', borderColor: 'color-mix(in srgb, var(--info) 28%, transparent)' },
  };

  return (
    <span style={{ ...baseStyle, ...(variants[variant] || variants.primary) }}>
      {children}
    </span>
  );
};

export default Badge;
