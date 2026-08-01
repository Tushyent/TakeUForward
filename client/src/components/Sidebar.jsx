import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';
import { LogOut, X, User } from 'lucide-react';
import { NAV_PRIMARY, NAV_CAREERS, NAV_COMMUNITY, NAV_ADMIN } from '../constants/navigation';
import { useAuth } from '../context/auth-context';

const BrandMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2" y="4" width="8" height="16" rx="2.5" fill="white" fillOpacity="0.95" />
    <rect x="14" y="10" width="8" height="10" rx="2.5" fill="white" fillOpacity="0.65" />
    <circle cx="18" cy="6" r="2.5" fill="white" fillOpacity="0.90" />
  </svg>
);

const SidebarItem = ({ to, icon: Icon, label, isActive, onClick }) => (
  <Link
    to={to}
    title={label}
    onClick={onClick}
    className={`sidebar-link ${isActive ? 'active' : ''}`}
  >
    <Icon
      size={16}
      style={{
        color: isActive ? '#A5B4FC' : 'currentColor',
        flexShrink: 0,
      }}
    />
    {label}
  </Link>
);

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

  const displayName =
    user?.name && user.name.length <= 18
      ? user.name
      : user?.email?.split('@')[0] || 'Profile';

  const SidebarContent = (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/home" onClick={onClose} className="sidebar-brand-link">
          <div className="sidebar-logo">
            <BrandMark />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-brand-name">
              Take<span style={{ color: '#A5B4FC' }}>U</span>Forward
            </span>
            <span className="sidebar-brand-sub">SSN Campus</span>
          </div>
        </Link>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {sections.map(({ label, items }) => (
          <div key={label}>
            <span className="sidebar-section-label">{label}</span>
            {items.map(({ to, icon, label: itemLabel }) => (
              <SidebarItem
                key={to}
                to={to}
                icon={icon}
                label={itemLabel}
                isActive={isActive(to)}
                onClick={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link
          to="/settings/profile"
          onClick={onClose}
          className="sidebar-footer-link"
          title="Profile Settings"
        >
          <User size={15} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </Link>

        <div className="sidebar-footer-actions">
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
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={`sidebar-container ${isOpen ? 'open' : ''}`}
        aria-label="Sidebar navigation"
      >
        {SidebarContent}
      </nav>
    </>
  );
};

export default Sidebar;
