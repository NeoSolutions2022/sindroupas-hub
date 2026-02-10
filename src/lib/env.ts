type RuntimeEnvLike = Record<string, string | undefined>;

declare global {
  interface Window {
    __ENV__?: RuntimeEnvLike;
  }
}

const BROWSER = typeof window !== "undefined";

const readFromImportMeta = (key: string) => {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const raw = env?.[key];
  return typeof raw === "string" ? raw : undefined;
};

const readFromWindow = (key: string) => {
  if (!BROWSER) return undefined;
  return window.__ENV__?.[key];
};

const readFromProcess = (key: string) => {
  const env = typeof process !== "undefined" ? process.env : undefined;
  return env?.[key];
};

const readEnv = (key: string) => {
  const aliases = key.startsWith("VITE_") ? [key, key.replace("VITE_", "")] : [key];

  for (const alias of aliases) {
    const value = readFromImportMeta(alias) ?? readFromWindow(alias) ?? readFromProcess(alias);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const getEnvValue = (key: string) => {
  const value = readEnv(key);
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${key}. Defina em .env (frontend) e reinicie o Vite.`,
    );
  }
  return value;
};

export const getAuthUrl = () => getEnvValue("VITE_AUTH_URL").replace(/\/$/, "");
export const getHasuraUrl = () => getEnvValue("VITE_HASURA_URL");
export const getHasuraAdminSecret = () => getEnvValue("VITE_HASURA_ADMIN_SECRET");
