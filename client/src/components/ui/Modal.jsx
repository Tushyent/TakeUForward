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
      background: 'rgba(0,0,0,0.70)', padding: 'var(--space-4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div style={{
        background: 'rgba(20, 20, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: 520, width: '100%',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default Modal;
