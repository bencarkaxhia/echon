/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * 
 * PATH: echon/frontend/src/components/ProtectedRoute.tsx
 */

import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}