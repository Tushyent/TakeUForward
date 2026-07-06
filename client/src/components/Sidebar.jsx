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
   Navigation structure
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
  { to: '/mock-interviews',     icon: MessageSquare,   label: 'Interviews' },
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

/* ---------------------------------------------------------------
   Sidebar Item
   --------------------------------------------------------------- */
const SidebarItem = ({ to, icon: Icon, label, isActive, onClick }) => {
  return (
    <Link
      to={to}
      title={label}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '10px var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        fontSize: 'var(--text-sm)',
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-input)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
      {label}
    </Link>
  );
};

/* ---------------------------------------------------------------
   Sidebar Component
   --------------------------------------------------------------- */
const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try { await axiosClient.get('/auth/logout'); } catch { /* silent */ }
    navigate('/login');
  };

  const SidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', padding: '0 var(--space-2)' }}>
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} onClick={onClose}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--primary-glow)',
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            TakeUForward
          </span>
        </Link>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', paddingRight: 'var(--space-2)', scrollbarWidth: 'thin' }}>
        <span className="sidebar-section-label" style={{ marginTop: 0 }}>Main</span>
        {NAV_PRIMARY.map(({ to, icon, label }) => (
          <SidebarItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} onClick={onClose} />
        ))}

        <span className="sidebar-section-label">Careers</span>
        {NAV_CAREERS.map(({ to, icon, label }) => (
          <SidebarItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} onClick={onClose} />
        ))}

        <span className="sidebar-section-label">Campus Life</span>
        {NAV_COMMUNITY.map(({ to, icon, label }) => (
          <SidebarItem key={to} to={to} icon={icon} label={label} isActive={isActive(to)} onClick={onClose} />
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>Account</span>
          <NotificationsDropdown />
        </div>
        <button
          onClick={() => { onClose(); handleLogout(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: '10px var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
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
