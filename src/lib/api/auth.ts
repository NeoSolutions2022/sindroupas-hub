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

export const meRequest = async (token: string) => {
  const response = await fetch(`${getAuthUrl()}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar usuário autenticado.");
  }

  return (await response.json()) as AuthUser;
};
