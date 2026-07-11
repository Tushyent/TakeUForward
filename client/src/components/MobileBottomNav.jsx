import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BOTTOM_NAV } from '../constants/navigation';

const MobileBottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
      {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={`mobile-bottom-nav-item ${isActive(to) ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
