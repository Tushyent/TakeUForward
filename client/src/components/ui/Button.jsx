import React from 'react';

/**
 * Button — primary shared action component.
 * Variants: primary | secondary | danger | success | ghost | outline
 * Uses CSS class .btn for base + transition behaviors, inline style for color.
 */
const Button = ({ children, variant = 'primary', size = 'md', style, className = '', ...props }) => {
  const sizeStyles = {
    sm: { padding: '7px 14px', fontSize: 'var(--text-xs)' },
    md: { padding: '10px 18px', fontSize: 'var(--text-sm)' },
    lg: { padding: '13px 24px', fontSize: 'var(--text-base)' },
  };

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid var(--danger)',
    },
    success: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid var(--success)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
    },
  };

  const hoverStyleMap = {
    primary:   { background: 'var(--primary-hover)', boxShadow: 'var(--shadow-glow)' },
    secondary: { background: 'var(--bg-input)', borderColor: 'var(--primary)' },
    danger:    { background: 'rgba(248,113,113,0.20)' },
    success:   { background: 'rgba(52,211,153,0.20)' },
    ghost:     { color: 'var(--text-primary)', background: 'var(--bg-elevated)' },
    outline:   { background: 'var(--primary-glow)' },
  };

  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      className={`btn ${className}`}
      style={{
        ...sizeStyles[size] || sizeStyles.md,
        ...variants[variant],
        ...(hovered && !props.disabled ? hoverStyleMap[variant] : {}),
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
