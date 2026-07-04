import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import AlumniInvite from './pages/AlumniInvite';
import CompleteProfile from './pages/CompleteProfile';
import CommunityPosts from './pages/CommunityPosts';
import Resources from './pages/Resources';
import ClubsList from './pages/ClubsList';
import ClubPage from './pages/ClubPage';
import ModerationQueue from './pages/ModerationQueue';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/alumni-invite/:token" element={<AlumniInvite />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/community/:id" element={<CommunityPosts />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/clubs" element={<ClubsList />} />
        <Route path="/clubs/:id" element={<ClubPage />} />
        <Route path="/moderation" element={<ModerationQueue />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
