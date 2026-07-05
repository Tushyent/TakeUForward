import React from 'react';

const Button = ({ children, variant = 'primary', style, ...props }) => {
  const baseStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.7 : 1,
    fontWeight: 500,
    fontSize: '15px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s, filter 0.2s',
    ...style
  };

  const variants = {
    primary: { background: 'var(--primary)', color: 'white' },
    secondary: { background: 'var(--border)', color: 'var(--text-h)' },
    danger: { background: 'var(--danger)', color: 'white' },
    success: { background: 'var(--success)', color: 'white' }
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
};

export default Button;
