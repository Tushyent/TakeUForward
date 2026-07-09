import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, profileComplete } = useAuth();
  const location = useLocation();

  if (isAuthenticated === null) {
    return <Spinner text="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Alumni without verification
  if (user?.role === 'alumni' && !user?.isVerifiedAlumni) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Allow users to reach /complete-profile if it's incomplete
  if (!profileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
