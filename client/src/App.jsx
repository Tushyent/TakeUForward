import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Home from './pages/Home';
import AlumniInvite from './pages/AlumniInvite';
import CompleteProfile from './pages/CompleteProfile';
import CommunityPosts from './pages/CommunityPosts';
import Resources from './pages/Resources';
import ClubsList from './pages/ClubsList';
import ClubPage from './pages/ClubPage';
import ModerationQueue from './pages/ModerationQueue';
import Chats from './pages/Chats';
import ChatThread from './pages/ChatThread';
import Announcements from './pages/Announcements';
import AlumniDirectory from './pages/AlumniDirectory';
import ReferralBoard from './pages/ReferralBoard';
import PublicProfile from './pages/PublicProfile';
import ProfileSettings from './pages/ProfileSettings';
import Reviews from './pages/Reviews';
import Bookmarks from './pages/Bookmarks';
import MockInterviews from './pages/MockInterviews';
import InterviewExperiences from './pages/InterviewExperiences';
import TeamFinder from './pages/TeamFinder';
import Electives from './pages/Electives';
import CareerRoadmaps from './pages/CareerRoadmaps';
import LostFound from './pages/LostFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/alumni-invite/:token" element={<AlumniInvite />} />
          
          {/* Protected Routes */}
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
          <Route path="/community/:id" element={<ProtectedRoute><CommunityPosts /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><ClubsList /></ProtectedRoute>} />
          <Route path="/clubs/:id" element={<ProtectedRoute><ClubPage /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/alumni" element={<ProtectedRoute><AlumniDirectory /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><ReferralBoard /></ProtectedRoute>} />
          <Route path="/mock-interviews" element={<ProtectedRoute><MockInterviews /></ProtectedRoute>} />
          <Route path="/interview-experiences" element={<ProtectedRoute><InterviewExperiences /></ProtectedRoute>} />
          <Route path="/team-finder" element={<ProtectedRoute><TeamFinder /></ProtectedRoute>} />
          <Route path="/electives" element={<ProtectedRoute><Electives /></ProtectedRoute>} />
          <Route path="/career-roadmaps" element={<ProtectedRoute><CareerRoadmaps /></ProtectedRoute>} />
          <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/moderation" element={<ProtectedRoute><ModerationQueue /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
