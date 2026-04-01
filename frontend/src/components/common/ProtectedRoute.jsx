import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  // If there is no logged-in user, redirect them to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected component (like the Dashboard)
  return children;
}