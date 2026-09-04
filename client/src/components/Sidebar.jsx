import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';
import ThemeToggle from './ThemeToggle';
import { LogOut, Zap, X, User } from 'lucide-react';
import { NAV_PRIMARY, NAV_CAREERS, NAV_COMMUNITY, NAV_ADMIN } from '../constants/navigation';
import { useAuth } from '../context/auth-context';

const SidebarItem = ({ to, icon: Icon, label, isActive, onClick }) => {
  return (
    <Link
      to={to}
      title={label}
      onClick={onClick}
      className={`sidebar-link ${isActive ? 'active' : ''}`}
    >
      <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
      {label}
    </Link>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try { await axiosClient.get('/auth/logout'); } catch { /* silent */ }
    window.location.href = '/login';
  };

  const sections = [
    { label: 'Main', items: NAV_PRIMARY },
    { label: 'Careers', items: NAV_CAREERS },
    { label: 'Campus Life', items: NAV_COMMUNITY },
    ...(user?.isPlatformAdmin ? [{ label: 'Admin', items: NAV_ADMIN }] : []),
  ];

  const SidebarContent = (
    <>
      <div className="sidebar-brand">
        <Link to="/home" onClick={onClose} className="sidebar-brand-link">
          <div className="sidebar-logo">
            <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div>
            <span className="sidebar-brand-name">TakeUForward</span>
          </div>
        </Link>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(({ label, items }) => (
          <div key={label} className="sidebar-section">
            <span className="sidebar-section-label">{label}</span>
            {items.map(({ to, icon, label: itemLabel }) => (
              <SidebarItem key={to} to={to} icon={icon} label={itemLabel} isActive={isActive(to)} onClick={onClose} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/settings/profile"
          onClick={onClose}
          className="sidebar-footer-link"
        >
          <User size={16} />
          {user?.name && user.name.length <= 15 ? user.name : user?.email?.split('@')[0] || 'Profile'}
        </Link>

        <div className="sidebar-footer-actions">
          <ThemeToggle />
          <NotificationsDropdown placement="top-left" />
          <button
            title="Logout"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
              handleLogout();
            }}
            className="sidebar-logout-btn"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div style={{
        padding: '6px 14px 2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
      }}>
        <a 
          href="https://tushyent-portfolio.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          Built with <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>❤️</span> by <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Tushyent</strong>
        </a>
        <Link 
          to="/tech" 
          onClick={onClose}
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.68rem',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="System Architecture & Interview Reference"
        >
          /tech
        </Link>
      </div>
    </>
  );

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <nav className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {SidebarContent}
      </nav>
    </>
  );
};

export default Sidebar;
