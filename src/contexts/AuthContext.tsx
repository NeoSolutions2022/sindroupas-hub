import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, meRequest, type AuthUser } from "@/lib/api/auth";
import { clearAuthToken, readAuthToken, saveAuthToken } from "@/lib/auth-storage";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearAuthToken();
    setState({ token: null, user: null });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = state.token ?? readAuthToken();
    if (!token) {
      setState({ token: null, user: null });
      return;
    }

    const user = await meRequest(token);
    setState({ token, user });
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const token = await loginRequest(email, password);
    saveAuthToken(token);

    try {
      const user = await meRequest(token);
      setState({ token, user });
    } catch {
      // Mantém sessão ativa mesmo se /auth/me falhar momentaneamente.
      setState({ token, user: null });
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = readAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Hidrata token imediatamente para manter sessão entre reloads/navegação.
      setState({ token: storedToken, user: null });
      setIsLoading(false);

      try {
        const user = await meRequest(storedToken);
        setState({ token: storedToken, user });
      } catch {
        // Não derruba sessão por falha temporária de /auth/me.
        setError(null);
      }
    };

    initialize();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isLoading,
      error,
      login,
      logout,
      refreshUser,
    }),
    [state, isLoading, error, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
};
