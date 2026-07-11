import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, profileComplete, isApproved } = useAuth();
  const location = useLocation();

  if (isAuthenticated === null) {
    return <Spinner text="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow completing profile first, then check approval
  if (!profileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Non-approved users (non-SSN emails waiting for admin approval)
  if (profileComplete && !isApproved && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

export default ProtectedRoute;
