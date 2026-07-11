import React from 'react';

const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

const Button = ({ children, variant = 'primary', size = 'md', style, className = '', type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClass[size] || ''} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
