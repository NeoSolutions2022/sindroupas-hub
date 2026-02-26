import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type MockUser = {
  id: string;
  name: string;
  role: "ADMIN" | "DIRETOR";
  area?: string;
};

export const mockUsers: MockUser[] = [
  { id: "u_admin", name: "Admin", role: "ADMIN" },
  { id: "u1", name: "William", role: "DIRETOR", area: "Representatividade" },
  { id: "u2", name: "Diretor Comercial", role: "DIRETOR", area: "Comercial" },
  { id: "u3", name: "Vice-Presidente", role: "DIRETOR", area: "Vice-Presidência" },
  { id: "u4", name: "Dir. Evento e Treinamento", role: "DIRETOR", area: "Eventos" },
  { id: "u5", name: "Dir. Inovação e ESG", role: "DIRETOR", area: "Inovação/ESG" },
  { id: "u6", name: "Dir. Financeiro", role: "DIRETOR", area: "Financeiro" },
  { id: "u7", name: "Coordenação Executiva", role: "DIRETOR", area: "Coordenação" },
];

type MockAuthContextValue = {
  currentUser: MockUser;
  impersonatedUserId: string | null;
  activeUser: MockUser;
  setImpersonatedUserId: (id: string | null) => void;
};

const MockAuthContext = createContext<MockAuthContextValue | undefined>(undefined);

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const currentUser = mockUsers[0]; // Admin
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);

  const activeUser = useMemo(() => {
    if (impersonatedUserId) {
      return mockUsers.find((u) => u.id === impersonatedUserId) ?? currentUser;
    }
    return currentUser;
  }, [impersonatedUserId, currentUser]);

  const value = useMemo<MockAuthContextValue>(
    () => ({ currentUser, impersonatedUserId, activeUser, setImpersonatedUserId }),
    [currentUser, impersonatedUserId, activeUser],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

export const useMockAuth = () => {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be inside MockAuthProvider");
  return ctx;
};
