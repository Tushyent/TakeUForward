import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Spinner from './components/ui/Spinner';

const Login = lazy(() => import('./pages/Login'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const Home = lazy(() => import('./pages/Home'));
const AlumniInvite = lazy(() => import('./pages/AlumniInvite'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const CommunityPosts = lazy(() => import('./pages/CommunityPosts'));
const CommunityBrowse = lazy(() => import('./pages/CommunityBrowse'));
const Resources = lazy(() => import('./pages/Resources'));
const ClubsList = lazy(() => import('./pages/ClubsList'));
const ClubPage = lazy(() => import('./pages/ClubPage'));
const ModerationQueue = lazy(() => import('./pages/ModerationQueue'));
const Chats = lazy(() => import('./pages/Chats'));
const ChatThread = lazy(() => import('./pages/ChatThread'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AlumniDirectory = lazy(() => import('./pages/AlumniDirectory'));
const ReferralBoard = lazy(() => import('./pages/ReferralBoard'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const MockInterviews = lazy(() => import('./pages/MockInterviews'));
const InterviewExperiences = lazy(() => import('./pages/InterviewExperiences'));
const TeamFinder = lazy(() => import('./pages/TeamFinder'));
const Electives = lazy(() => import('./pages/Electives'));
const CareerRoadmaps = lazy(() => import('./pages/CareerRoadmaps'));
const LostFound = lazy(() => import('./pages/LostFound'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const PersonalDrive = lazy(() => import('./pages/PersonalDrive'));
const About = lazy(() => import('./pages/About'));
const Support = lazy(() => import('./pages/Support'));
const AdminSupportQueue = lazy(() => import('./pages/AdminSupportQueue'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminOnly = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isPlatformAdmin) return <Navigate to="/home" replace />;
  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Suspense fallback={<Spinner text="Loading page..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/alumni-invite/:token" element={<AlumniInvite />} />

              {/* Protected Routes inside AppLayout */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/complete-profile" element={<CompleteProfile />} />
                      <Route path="/community" element={<CommunityBrowse />} />
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
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/moderation" element={<AdminOnly><ModerationQueue /></AdminOnly>} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/activity" element={<AdminOnly><ActivityLog /></AdminOnly>} />
                      <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
                      <Route path="/admin/support" element={<AdminOnly><AdminSupportQueue /></AdminOnly>} />
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
          </Suspense>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
