import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/catalog" replace />;
  }

  // Renders nested component if wrapped around children, or Outlet if used as layout route
  return children ? children : <Outlet />;
};

export default ProtectedRoute;