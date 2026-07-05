import React from 'react';

/**
 * Input, Textarea, Select — shared form elements.
 * All share the same base style for consistent visual language.
 */
const baseStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'inherit',
  fontWeight: '400',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  outline: 'none',
};

const focusStyle = {
  borderColor: 'var(--primary)',
  boxShadow: '0 0 0 3px var(--primary-glow)',
};

const blurStyle = {
  borderColor: 'var(--border)',
  boxShadow: 'none',
};

export const Input = React.forwardRef(({ style, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      ref={ref}
      style={{
        ...baseStyle,
        ...(focused ? focusStyle : blurStyle),
        ...style,
      }}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ style, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      ref={ref}
      style={{
        ...baseStyle,
        resize: 'vertical',
        minHeight: '100px',
        lineHeight: '1.6',
        ...(focused ? focusStyle : blurStyle),
        ...style,
      }}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ style, children, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      ref={ref}
      style={{
        ...baseStyle,
        appearance: 'auto',
        ...(focused ? focusStyle : blurStyle),
        ...style,
      }}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';
