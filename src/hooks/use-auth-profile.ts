import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { extractAuthProfile } from "@/lib/auth-claims";

export const useAuthProfile = () => {
  const { token, user } = useAuth();

  return useMemo(() => extractAuthProfile(token, user), [token, user]);
};
