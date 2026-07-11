import React, { useEffect } from 'react';

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-surface-raised, var(--color-surface, #1e1e2e))',
        borderRadius: 'var(--radius-lg)', maxWidth: 520, width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {children}
      </div>
    </div>
  );
};

export default Modal;
