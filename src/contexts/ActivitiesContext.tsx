import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ActivityType = "EVENTO" | "PARCERIA" | "NEGOCIO" | "NOVO_ASSOCIADO";

export const activityTypeLabels: Record<ActivityType, string> = {
  EVENTO: "Evento realizado",
  PARCERIA: "Parceria firmada",
  NEGOCIO: "Negócio gerado",
  NOVO_ASSOCIADO: "Novo associado",
};

export type Activity = {
  id: string;
  userId: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  quantity: number;
  note: string;
};

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth(); // 0-based
const fmt = (month: number, day: number) =>
  `${y}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const initialActivities: Activity[] = [
  { id: "a1", userId: "u1", type: "EVENTO", date: fmt(m, 5), quantity: 45, note: "Workshop têxtil sustentável" },
  { id: "a2", userId: "u4", type: "EVENTO", date: fmt(m, 12), quantity: 120, note: "Feira anual de moda" },
  { id: "a3", userId: "u2", type: "EVENTO", date: fmt(m - 1 < 0 ? 11 : m - 1, 20), quantity: 30, note: "Rodada de negócios" },
  { id: "a4", userId: "u2", type: "PARCERIA", date: fmt(m, 8), quantity: 1, note: "Parceria com SENAI" },
  { id: "a5", userId: "u5", type: "PARCERIA", date: fmt(m - 1 < 0 ? 11 : m - 1, 15), quantity: 1, note: "Convênio com universidade" },
  { id: "a6", userId: "u2", type: "NEGOCIO", date: fmt(m, 3), quantity: 2, note: "Contrato com varejista" },
  { id: "a7", userId: "u6", type: "NEGOCIO", date: fmt(m, 18), quantity: 1, note: "Acordo fornecedor internacional" },
  { id: "a8", userId: "u1", type: "NOVO_ASSOCIADO", date: fmt(m, 10), quantity: 3, note: "Novas confecções filiadas" },
  { id: "a9", userId: "u7", type: "NOVO_ASSOCIADO", date: fmt(m - 1 < 0 ? 11 : m - 1, 25), quantity: 2, note: "Empresas da região sul" },
  { id: "a10", userId: "u3", type: "EVENTO", date: fmt(m, 22), quantity: 80, note: "Seminário de inovação" },
];

type ActivitiesContextValue = {
  activities: Activity[];
  addActivity: (a: Omit<Activity, "id">) => void;
  updateActivity: (id: string, a: Partial<Omit<Activity, "id">>) => void;
  removeActivity: (id: string) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | undefined>(undefined);

let nextId = 100;

export const ActivitiesProvider = ({ children }: { children: React.ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = useCallback((a: Omit<Activity, "id">) => {
    setActivities((prev) => [...prev, { ...a, id: `a_${nextId++}` }]);
  }, []);

  const updateActivity = useCallback((id: string, patch: Partial<Omit<Activity, "id">>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo(
    () => ({ activities, addActivity, updateActivity, removeActivity }),
    [activities, addActivity, updateActivity, removeActivity],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
};

export const useActivities = () => {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be inside ActivitiesProvider");
  return ctx;
};
