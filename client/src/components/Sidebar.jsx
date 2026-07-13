import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';
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
            <Zap size={18} color="white" fill="white" />
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
          <div key={label}>
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
