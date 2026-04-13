import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useAuthProfile } from "@/hooks/use-auth-profile";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, isLoading } = useAuth();
  const location = useLocation();
  const { isAdmin } = useAuthProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando sessão...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && location.pathname !== "/dashboard/atividades") {
    return <Navigate to="/dashboard/atividades" replace />;
  }

  return <>{children}</>;
};
