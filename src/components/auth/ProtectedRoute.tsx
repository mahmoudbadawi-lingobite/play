import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';
import { ConsentGate } from './ConsentGate';

export function ProtectedRoute({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { profile, loading, isGuest } = useAuth();

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!profile) {
    if (isGuest) return <Navigate to="/" replace />;
    return <Navigate to="/" replace />;
  }
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ConsentGate>{children}</ConsentGate>;
}
