import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';
import {
  Home, BookOpen, Users, Megaphone, GraduationCap, Briefcase,
  MessageSquare, FileText, UserCheck, Lightbulb, Map,
  Package, ShoppingBag, Star, Bookmark, LogOut, Zap, Menu, X
} from 'lucide-react';

/* ---------------------------------------------------------------
   Navigation structure — split into PRIMARY and SECONDARY groups
   so the mobile drawer can render them with section labels.
   --------------------------------------------------------------- */
const NAV_PRIMARY = [
  { to: '/home',                icon: Home,           label: 'Home' },
  { to: '/resources',           icon: BookOpen,        label: 'Resources' },
  { to: '/clubs',               icon: Users,           label: 'Clubs' },
  { to: '/announcements',       icon: Megaphone,       label: 'Announcements' },
];

const NAV_CAREERS = [
  { to: '/alumni',              icon: GraduationCap,   label: 'Alumni' },
  { to: '/referrals',           icon: Briefcase,       label: 'Referrals' },
  { to: '/mock-interviews',     icon: MessageSquare,   label: 'Mock Interviews' },
  { to: '/interview-experiences', icon: FileText,      label: 'Experiences' },
  { to: '/career-roadmaps',     icon: Map,             label: 'Roadmaps' },
  { to: '/reviews',             icon: Star,            label: 'Reviews' },
  { to: '/electives',           icon: Lightbulb,       label: 'Electives' },
];

const NAV_COMMUNITY = [
  { to: '/team-finder',         icon: UserCheck,       label: 'Team Finder' },
  { to: '/lost-found',          icon: Package,         label: 'Lost & Found' },
  { to: '/marketplace',         icon: ShoppingBag,     label: 'Marketplace' },
  { to: '/bookmarks',           icon: Bookmark,        label: 'Saved' },
  { to: '/chats',               icon: MessageSquare,   label: 'Inbox' },
];

/* All items for the desktop scrollable bar */
const ALL_NAV_ITEMS = [...NAV_PRIMARY, ...NAV_CAREERS, ...NAV_COMMUNITY];

/* ---------------------------------------------------------------
   NavLink — single item for desktop bar or drawer
   --------------------------------------------------------------- */
const NavItem = ({ to, icon: Icon, label, isActive, drawer = false }) => {
  if (drawer) {
    return (
      <Link to={to} className={isActive ? 'active' : ''}>
        <Icon size={16} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        fontSize: 'var(--text-xs)',
        fontWeight: isActive ? 600 : 500,
        whiteSpace: 'nowrap',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
        textDecoration: 'none',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <Icon size={14} />
      {label}
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: 0,
          left: 10,
          right: 10,
          height: 2,
          background: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 0 6px var(--primary)',
        }} />
      )}
    </Link>
  );
};

/* ---------------------------------------------------------------
   Navbar
   --------------------------------------------------------------- */
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

  return (
    <>
      {/* ── NAVBAR BAR ── */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 var(--space-5)',
        height: 58,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        width: '100%',
      }}>

        {/* Brand */}
        <Link to="/home" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          flexShrink: 0,
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--primary-glow)',
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}>
            TakeUForward
          </span>
        </Link>

        {/* Desktop nav links (hidden below 900px via CSS class) */}
        <div className="nav-desktop-links">
          {ALL_NAV_ITEMS.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} />
          ))}
        </div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          <NotificationsDropdown />

          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--danger-bg)';
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.borderColor = 'var(--danger)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <LogOut size={13} />
            <span className="nav-desktop-links" style={{
              display: 'inline',
              flex: 'unset',
              overflow: 'visible',
              margin: 0,
            }}>Logout</span>
          </button>

          {/* Hamburger (visible below 900px) */}
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

      {/* ── MOBILE DRAWER OVERLAY ── */}
      <div
        className={`nav-overlay ${drawerOpen ? 'visible' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── MOBILE DRAWER ── */}
      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-label="Navigation menu">
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              TakeUForward
            </span>
          </div>
          <button
            onClick={closeDrawer}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 4,
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary */}
        <span className="nav-section-label" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>Main</span>
        {NAV_PRIMARY.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} drawer onClick={closeDrawer} />
        ))}

        <span className="nav-section-label">Careers & Academics</span>
        {NAV_CAREERS.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} drawer onClick={closeDrawer} />
        ))}

        <span className="nav-section-label">Campus Life</span>
        {NAV_COMMUNITY.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} drawer onClick={closeDrawer} />
        ))}

        {/* Logout in drawer */}
        <span className="nav-section-label">Account</span>
        <button
          onClick={() => { closeDrawer(); handleLogout(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            width: '100%',
            textAlign: 'left',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );
};

export default Navbar;
