import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { extractAuthSessionClaims } from "@/lib/auth-claims";

export const useAuthProfile = () => {
  const { token, user } = useAuth();

  return useMemo(() => extractAuthSessionClaims(token, user), [token, user]);
};
