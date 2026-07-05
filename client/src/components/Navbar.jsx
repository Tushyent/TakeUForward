import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationsDropdown from './NotificationsDropdown';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosClient.get('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      background: '#282c34',
      color: 'white',
      marginBottom: '20px'
    }}>
      <div>
        <Link to="/home" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>
          TakeUForward
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/home" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        <Link to="/resources" style={{ color: 'white', textDecoration: 'none' }}>Resources</Link>
        <Link to="/clubs" style={{ color: 'white', textDecoration: 'none' }}>Clubs</Link>
        <Link to="/announcements" style={{ color: 'white', textDecoration: 'none' }}>Announcements</Link>
        <Link to="/alumni" style={{ color: 'white', textDecoration: 'none' }}>Alumni</Link>
        <Link to="/referrals" style={{ color: 'white', textDecoration: 'none' }}>Referrals</Link>
        <Link to="/reviews" style={{ color: 'white', textDecoration: 'none' }}>Reviews</Link>
        <Link to="/bookmarks" style={{ color: 'white', textDecoration: 'none' }}>Saved</Link>
        <Link to="/chats" style={{ color: 'white', textDecoration: 'none' }}>Inbox</Link>
        <NotificationsDropdown />
        <button 
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
