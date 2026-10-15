import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. If there is no authentication token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check roles if specified
  if (allowedRoles) {
    // Ensure allowedRoles is treated as an array whether passed as a string or array
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(userRole)) {
      // If the user's role isn't authorized, safely send them back to the catalog
      return <Navigate to="/catalog" replace />;
    }
  }

  // 3. Render nested components or Outlet if everything matches
  return children ? children : <Outlet />;
};

export default ProtectedRoute;