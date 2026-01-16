import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, roles, isAuthLoading, isUserDataLoading } = useAuth();
  const location = useLocation();

  const needsRoleCheck = (requiredRoles?.length ?? 0) > 0;

  // Only block the whole app while we determine if there is a session.
  // Block on roles/profile ONLY when a route explicitly requires roles.
  if (isAuthLoading || (needsRoleCheck && isUserDataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsRoleCheck) {
    const hasRequiredRole = requiredRoles!.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
