// frontend/src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth(); // Access isAuthenticated and loading from AuthContext

  if (loading) {
    // Optionally, render a loading spinner while authentication status is being determined
    return <div className="flex items-center justify-center min-h-screen text-xl text-gray-700">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children; // Render the protected component if authenticated
}

export default PrivateRoute;