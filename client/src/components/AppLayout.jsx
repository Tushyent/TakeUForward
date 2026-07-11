import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { Menu, Zap } from 'lucide-react';

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
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={13} color="white" fill="white" />
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              TakeUForward
            </div>
          </div>
          <button 
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
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
