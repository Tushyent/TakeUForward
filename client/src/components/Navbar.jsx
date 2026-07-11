import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';
import { LogOut, Zap, Menu, X, Settings } from 'lucide-react';
import { NAV_PRIMARY, NAV_CAREERS, NAV_COMMUNITY, ALL_NAV_ITEMS } from '../constants/navigation';

const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <Link
      to={to}
      title={label}
      className={`nav-desktop-item ${isActive ? 'active' : ''}`}
    >
      <Icon size={14} />
      {label}
      {isActive && <span className="nav-active-bar" />}
    </Link>
  );
};

const DrawerItem = ({ to, icon: Icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`nav-drawer-item ${isActive ? 'active' : ''}`}
  >
    <Icon size={16} />
    {label}
  </Link>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try { await axiosClient.get('/auth/logout'); } catch { /* silent */ }
    navigate('/login');
  };

  const closeDrawer = () => setDrawerOpen(false);

  const drawerSections = [
    { label: 'Main', items: NAV_PRIMARY },
    { label: 'Careers & Academics', items: NAV_CAREERS },
    { label: 'Campus Life', items: NAV_COMMUNITY },
  ];

  return (
    <>
      <nav className="navbar">
        <Link to="/home" className="navbar-brand">
          <div className="navbar-logo">
            <Zap size={16} color="white" fill="white" />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">TakeUForward</span>
            {/* <span className="navbar-brand-sub">SSN College of Engineering</span> */}
          </div>
        </Link>

        <div className="nav-desktop-links">
          {ALL_NAV_ITEMS.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} />
          ))}
        </div>

        <div className="navbar-actions">
          <NotificationsDropdown />
          <Link to="/settings/profile" title="Profile Settings" className="navbar-settings-btn">
            <Settings size={16} />
          </Link>
          <button onClick={handleLogout} title="Logout" className="navbar-logout-btn">
            <LogOut size={13} />
            <span className="nav-desktop-links logout-label">Logout</span>
          </button>
          <button
            className="hamburger-btn"
            onClick={() => setDrawerOpen(o => !o)}
            title="Menu"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      <div
        className={`nav-overlay ${drawerOpen ? 'visible' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-label="Navigation menu">
        <div className="nav-drawer-header">
          <div className="navbar-brand">
            <div className="navbar-logo">
              <Zap size={14} color="white" fill="white" />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-brand-name">TakeUForward</span>
              <span className="navbar-brand-sub">SSN College of Engineering</span>
            </div>
          </div>
          <button onClick={closeDrawer} className="nav-drawer-close" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {drawerSections.map(({ label, items }) => (
          <div key={label}>
            <span className="nav-section-label">{label}</span>
            {items.map(({ to, icon, label: itemLabel }) => (
              <DrawerItem key={to} to={to} icon={icon} label={itemLabel} isActive={isActive(to)} onClick={closeDrawer} />
            ))}
          </div>
        ))}

        <div className="nav-drawer-account">
          <Link
            to="/settings/profile"
            onClick={closeDrawer}
            className="nav-drawer-item"
          >
            <Settings size={16} />
            Profile Settings
          </Link>
          <div className="nav-drawer-account-actions">
            <NotificationsDropdown placement="bottom-right" />
            <button
              title="Logout"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeDrawer();
                handleLogout();
              }}
              className="nav-drawer-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
