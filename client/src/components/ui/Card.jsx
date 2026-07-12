import React from 'react';

/**
 * Card — surface container component.
 * variant: default | elevated | glass | highlight
 * lift: adds hover lift animation (sets cursor:pointer)
 * noHover: explicitly disable hover effects when lift is true
 * accent: CSS color value used for hover border highlight (sets --card-accent)
 */
const Card = ({ children, style, variant = 'default', lift = false, noHover = false, accent = '', className = '', ...props }) => {
  const cls = [
    'card',
    `card-${variant}`,
    lift ? 'card-lift' : '',
    noHover ? 'card-no-hover' : '',
    className,
  ].filter(Boolean).join(' ');

  const mergedStyle = accent ? { ...style, '--card-accent': accent } : style;

  return (
    <div className={cls} style={mergedStyle} {...props}>
      {children}
    </div>
  );
};

export default Card;
