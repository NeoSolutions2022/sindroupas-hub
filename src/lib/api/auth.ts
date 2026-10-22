import { getAuthUrl } from "@/lib/env";

type LoginResponse = {
  token?: string;
  access_token?: string;
  accessToken?: string;
  jwt?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  status?: string | null;
  is_active?: boolean;
};

export type AppUserAdminItem = {
  id: string;
  email: string;
  name: string;
  profile_code: string;
  profile_label: string;
  is_active: boolean;
  created_at: string;
};

export type CreateAppUserPayload = {
  email: string;
  name: string;
  profile_code: string;
  password: string;
};

export type UpdateAppUserPayload = {
  email: string;
  name: string;
  profile_code: string;
};

const normalizeToken = (payload: LoginResponse) => {
  return payload.token ?? payload.access_token ?? payload.accessToken ?? payload.jwt ?? null;
};

export const loginRequest = async (email: string, password: string) => {
  const response = await fetch(`${getAuthUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Falha ao autenticar. Verifique suas credenciais.");
  }

  const payload = (await response.json()) as LoginResponse;
  const token = normalizeToken(payload);

  if (!token) {
    throw new Error("Token de autenticação não encontrado.");
  }

  return token;
};

export const normalizeAuthUser = (payload: unknown): AuthUser => {
  const user = payload && typeof payload === "object" && "user" in payload ? payload.user : payload;
  if (!user || typeof user !== "object" || !("id" in user) || typeof user.id !== "string" || !user.id.trim() || !("email" in user) || typeof user.email !== "string") {
    throw new Error("Resposta inválida do serviço de autenticação.");
  }
  const normalized = user as AuthUser;
  if (normalized.is_active === false || ["inactive", "inativo", "disabled", "blocked", "bloqueado"].includes(normalized.status?.trim().toLowerCase() ?? "")) {
    throw new Error("Usuário não está ativo. Contate o administrador.");
  }
  return normalized;
};

export const meRequest = async (token: string) => {
  const response = await fetch(`${getAuthUrl()}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar usuário autenticado.");
  }

  return normalizeAuthUser(await response.json());
};

const authAdminRequest = async <T>(path: string, token: string, method = "GET", body?: unknown) => {
  const response = await fetch(`${getAuthUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Falha ao executar ação administrativa.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

export const listAppUsersRequest = async (token: string) => {
  return authAdminRequest<AppUserAdminItem[]>("/admin/app-users", token);
};

export const createAppUserRequest = async (token: string, payload: CreateAppUserPayload) => {
  return authAdminRequest<AppUserAdminItem>("/admin/app-users", token, "POST", payload);
};

export const updateAppUserRequest = async (token: string, id: string, payload: UpdateAppUserPayload) => {
  return authAdminRequest<AppUserAdminItem>(`/admin/app-users/${id}`, token, "PATCH", payload);
};

export const updateAppUserStatusRequest = async (token: string, id: string, is_active: boolean) => {
  return authAdminRequest<AppUserAdminItem>(`/admin/app-users/${id}/status`, token, "PATCH", { is_active });
};

export const resetAppUserPasswordRequest = async (token: string, id: string, password: string) => {
  return authAdminRequest<{ message?: string }>(`/admin/app-users/${id}/reset-password`, token, "PATCH", { password });
};
