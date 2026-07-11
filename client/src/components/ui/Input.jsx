import React from 'react';

/**
 * Input, Textarea, Select — shared form elements.
 * All use the .input CSS class with :focus pseudo-class for styling.
 */
export const Input = React.forwardRef(({ className = '', style, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`input ${className}`.trim()}
      style={style}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className = '', style, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`input ${className}`.trim()}
      style={{ resize: 'vertical', minHeight: '100px', lineHeight: '1.6', ...style }}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className = '', style, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`input ${className}`.trim()}
      style={{ appearance: 'auto', ...style }}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';
