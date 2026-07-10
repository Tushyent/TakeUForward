import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
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
import Marketplace from './pages/Marketplace';
import PersonalDrive from './pages/PersonalDrive';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/alumni-invite/:token" element={<AlumniInvite />} />
          <Route path="/about" element={<About />} />
          
          {/* Protected Routes inside AppLayout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/complete-profile" element={<CompleteProfile />} />
                  <Route path="/community/:id" element={<CommunityPosts />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/clubs" element={<ClubsList />} />
                  <Route path="/clubs/:id" element={<ClubPage />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/alumni" element={<AlumniDirectory />} />
                  <Route path="/referrals" element={<ReferralBoard />} />
                  <Route path="/mock-interviews" element={<MockInterviews />} />
                  <Route path="/interview-experiences" element={<InterviewExperiences />} />
                  <Route path="/team-finder" element={<TeamFinder />} />
                  <Route path="/electives" element={<Electives />} />
                  <Route path="/career-roadmaps" element={<CareerRoadmaps />} />
                  <Route path="/lost-found" element={<LostFound />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/drive" element={<PersonalDrive />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/moderation" element={<ModerationQueue />} />
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/chat/:userId" element={<ChatThread />} />
                  <Route path="/profile/:username" element={<PublicProfile />} />
                  <Route path="/settings/profile" element={<ProfileSettings />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
