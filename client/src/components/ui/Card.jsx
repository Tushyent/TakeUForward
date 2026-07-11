import React from 'react';

/**
 * Card — surface container component.
 * variant: default | elevated | glass | highlight
 * lift: adds hover lift animation
 */
const Card = ({ children, style, variant = 'default', lift = false, className = '', ...props }) => {
  const cls = `card card-${variant} ${lift ? 'card-lift' : ''} ${className}`.trim();

  return (
    <div className={cls} style={style} {...props}>
      {children}
    </div>
  );
};

export default Card;
