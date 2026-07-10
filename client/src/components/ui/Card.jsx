import React from 'react';

/**
 * Card — surface container component.
 * variant: default | elevated | glass | highlight
 * lift: adds hover lift animation (not on glass cards)
 */
const Card = ({ children, style, variant = 'default', lift = false, className = '', ...props }) => {
  const [hovered, setHovered] = React.useState(false);

  const baseStyle = {
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
    border: '1px solid var(--border)',
    transition: 'box-shadow var(--transition-base), transform var(--transition-base), border-color var(--transition-base)',
  };

  const variants = {
    default: {
      background: 'var(--glass-surface)',
      backdropFilter: 'blur(var(--glass-surface-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-surface-blur))',
      boxShadow: 'var(--shadow-sm)',
      borderColor: 'var(--glass-border)',
    },
    elevated: {
      background: 'var(--glass-surface-hover)',
      backdropFilter: 'blur(var(--glass-surface-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-surface-blur))',
      boxShadow: 'var(--shadow-md)',
      borderColor: 'var(--glass-border-strong)',
    },
    glass: {
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      boxShadow: 'var(--shadow-md)',
      borderColor: 'rgba(255,255,255,0.08)',
    },
    highlight: {
      background: 'var(--bg-surface)',
      boxShadow: 'var(--shadow-glow)',
      borderColor: 'var(--primary)',
    },
  };

  const liftStyle = lift && hovered ? {
    boxShadow: 'var(--shadow-md)',
    transform: 'translateY(-2px)',
    borderColor: 'var(--border-strong)',
  } : {};

  return (
    <div
      className={className}
      style={{ ...baseStyle, ...variants[variant], ...liftStyle, ...style }}
      onMouseEnter={() => lift && setHovered(true)}
      onMouseLeave={() => lift && setHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
