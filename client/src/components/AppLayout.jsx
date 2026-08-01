import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import NotificationsDropdown from './NotificationsDropdown';
import { Menu } from 'lucide-react';

const BrandMark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2" y="4" width="8" height="16" rx="2.5" fill="white" fillOpacity="0.95" />
    <rect x="14" y="10" width="8" height="10" rx="2.5" fill="white" fillOpacity="0.65" />
    <circle cx="18" cy="6" r="2.5" fill="white" fillOpacity="0.90" />
  </svg>
);

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="app-main">
        <header className="mobile-header">
          <div className="mobile-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(99,102,241,0.40)',
            }}>
              <BrandMark />
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontFamily: 'var(--font-sans)' }}>
              TakeUForward
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NotificationsDropdown placement="bottom-right" />
            <button 
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>
        
        <div className="app-content">
          {children}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
