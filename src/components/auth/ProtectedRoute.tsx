import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const {
    user,
    roles,
    isAuthLoading,
    isUserDataLoading,
    isApprovedFarmer,
  } = useAuth();

  const location = useLocation();
  const needsRoleCheck = (requiredRoles?.length ?? 0) > 0;

  const isLoading =
    isAuthLoading || (needsRoleCheck && isUserDataLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (needsRoleCheck) {
    const hasRequiredRole = requiredRoles!.some((role) =>
      roles.includes(role)
    );

    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }

    // Extra protection for farmers (must be approved)
    if (
      requiredRoles!.includes('farmer') &&
      !isApprovedFarmer
    ) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
