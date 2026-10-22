import { getIntelligenceApiUrl } from "@/lib/env";

export class IntelligenceApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "IntelligenceApiError"; }
}
export const isIntelligenceAccessError = (error: unknown) => error instanceof IntelligenceApiError && [401, 403].includes(error.status);

export async function intelligenceRequest<T>(path: string, token: string, method = "GET", body?: unknown): Promise<T> {
  const base = getIntelligenceApiUrl();
  if (!base) throw new Error("O serviço de inteligência ainda não foi configurado neste ambiente.");
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new IntelligenceApiError(typeof payload.detail === "string" ? payload.detail : `Não foi possível concluir a operação (HTTP ${response.status}).`, response.status);
  return payload as T;
}

export interface AgentProposal {
  id: string;
  status: string;
  entity: string;
  action: "create" | "update";
  values: Record<string, unknown>;
  before: Record<string, unknown> | null;
  summary: string;
  result?: { error?: string };
}
export interface AgentHistory {
  items: { request_id: string; message: string; answer: string; proposals: AgentProposal[] }[];
  quota: { used: number; remaining: number; limit: number; day: string };
}
export interface NewsletterSettings {
  enabled: boolean;
  time: string;
  destination_type: "number" | "group";
  number: string;
  cta_label: string;
  cta_url: string;
  notes: string;
  source_links: string[];
  photo_url: string;
  photo_urls: string[];
  photo_caption: string;
  images_enabled: boolean;
}
export interface NewsletterEdition {
  id: string;
  week: string;
  status: "generating" | "ready" | "failed";
  period_start: string;
  period_end: string;
  content: string | null;
  error: string | null;
  articles: { title: string; url: string; published_at: string }[];
  media?: { url: string; caption: string }[];
  image_assets?: { id: string; position: number; caption: string }[];
  images_enabled?: boolean;
  deliveries: { id: string; status: string; number: string; error: string | null }[];
}
export interface NewsletterState {
  settings: NewsletterSettings;
  editions: NewsletterEdition[];
  model?: string;
  jobs?: { id: string; status: string; error: string | null; created_at: string }[];
}

export async function intelligenceImage(id: string, token: string): Promise<Blob> {
  const response = await fetch(`${getIntelligenceApiUrl()}/newsletter/images/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Não foi possível carregar o card. Verifique sua sessão.");
  return response.blob();
}
