import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/use-auth-profile";
import { useToast } from "@/hooks/use-toast";
import { hasuraRequest } from "@/lib/api/hasura";

const SEEN_REQUESTS_KEY = "sindroupas_seen_public_registration_requests";
const DASHBOARD_NOTIFICATIONS_KEY = "sindroupas_dashboard_notifications";

type PendingRequest = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  created_at: string;
};

type PendingRequestsResponse = {
  solicitacoes_associacao: PendingRequest[];
};

const readStoredList = (key: string) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
};

export function PublicRegistrationNotifier() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const { isAdmin } = useAuthProfile();
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ["pending-public-registration-notifications"],
    queryFn: () =>
      hasuraRequest<PendingRequestsResponse>({
        query: `
          query PendingPublicRegistrationNotifications {
            solicitacoes_associacao(
              where: { status: { _in: ["pendente", "em_analise"] } }
              order_by: { created_at: desc }
              limit: 50
            ) {
              id
              razao_social
              nome_fantasia
              created_at
            }
          }
        `,
        token,
      }),
    enabled: Boolean(token && isAdmin),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!token || !isAdmin || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (!data) return;

    const requests = data.solicitacoes_associacao;
    const storedIds = readStoredList(SEEN_REQUESTS_KEY);

    if (!initialized.current && storedIds.length === 0) {
      window.localStorage.setItem(SEEN_REQUESTS_KEY, JSON.stringify(requests.map((request) => request.id)));
      initialized.current = true;
      return;
    }

    initialized.current = true;
    const seenIds = new Set(storedIds);
    const newRequests = requests.filter((request) => !seenIds.has(request.id));
    if (newRequests.length === 0) return;

    const newest = newRequests[0];
    const companyName = newest.nome_fantasia?.trim() || newest.razao_social;
    const title = newRequests.length === 1
      ? "Novo cadastro para revisão"
      : `${newRequests.length} novos cadastros para revisão`;
    const description = newRequests.length === 1
      ? `${companyName} enviou uma solicitação pública.`
      : "Há novas solicitações públicas aguardando análise.";

    toast({ title, description });

    const dashboardNotifications = readStoredList(DASHBOARD_NOTIFICATIONS_KEY);
    window.localStorage.setItem(
      DASHBOARD_NOTIFICATIONS_KEY,
      JSON.stringify([`${title}: ${description}`, ...dashboardNotifications].slice(0, 20)),
    );
    window.dispatchEvent(new Event("dashboard-notifications-updated"));

    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body: description,
        icon: "/favicon.svg",
        tag: "new-public-registration",
      });
      notification.onclick = () => {
        window.focus();
        navigate("/dashboard/empresas");
        notification.close();
      };
    }

    const updatedSeenIds = Array.from(new Set([...requests.map((request) => request.id), ...storedIds])).slice(0, 200);
    window.localStorage.setItem(SEEN_REQUESTS_KEY, JSON.stringify(updatedSeenIds));
  }, [data, navigate, toast]);

  useEffect(() => {
    if (!token) initialized.current = false;
  }, [token]);

  return null;
}
