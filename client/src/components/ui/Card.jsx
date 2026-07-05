import React from 'react';

const Card = ({ children, style, ...props }) => {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card, 12px)',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow)',
      ...style
    }} {...props}>
      {children}
    </div>
  );
};

export default Card;
