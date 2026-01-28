const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const HASURA_URL = import.meta.env.VITE_HASURA_URL;
const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

const AUTH_TOKEN_KEY = "sindroupas.auth.token";

type JsonRecord = Record<string, unknown>;

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

const requestJson = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message || response.statusText;
    throw new Error(message || "Erro na requisição.");
  }

  return payload as T;
};

export const authLogin = async (email: string, password: string) => {
  if (!AUTH_URL) {
    throw new Error("AUTH_URL não configurada.");
  }

  const data = await requestJson<JsonRecord>(`${AUTH_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const token =
    (data.token as string | undefined) ||
    (data.access_token as string | undefined) ||
    (data.accessToken as string | undefined);

  if (!token) {
    throw new Error("Token não retornado pela autenticação.");
  }

  setAuthToken(token);
  return token;
};

export const authMe = async <T>() => {
  if (!AUTH_URL) {
    throw new Error("AUTH_URL não configurada.");
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error("Token não encontrado.");
  }

  return requestJson<T>(`${AUTH_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const hasuraRequest = async <T>(query: string, variables?: JsonRecord) => {
  if (!HASURA_URL) {
    throw new Error("HASURA_URL não configurada.");
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (HASURA_ADMIN_SECRET) {
    headers["x-hasura-admin-secret"] = HASURA_ADMIN_SECRET;
  }

  return requestJson<T>(HASURA_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
};
