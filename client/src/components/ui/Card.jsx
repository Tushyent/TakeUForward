import React from 'react';

const Card = ({ children, style, ...props }) => {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: 'var(--shadow)',
      ...style
    }} {...props}>
      {children}
    </div>
  );
};

export default Card;
