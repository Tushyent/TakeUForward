import React from 'react';

const baseStyle = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: 'var(--radius-btn, 8px)',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text-h)',
  fontSize: '15px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  outline: 'none'
};

export const Input = React.forwardRef(({ style, ...props }, ref) => {
  return (
    <input
      ref={ref}
      style={{ ...baseStyle, ...style }}
      {...props}
      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
    />
  );
});

export const Textarea = React.forwardRef(({ style, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      style={{ ...baseStyle, resize: 'vertical', minHeight: '80px', ...style }}
      {...props}
      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
    />
  );
});

export const Select = React.forwardRef(({ style, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      style={{ ...baseStyle, appearance: 'auto', paddingRight: '30px', ...style }}
      {...props}
      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
    >
      {children}
    </select>
  );
});
