const getEnvValue = (key: string) => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }
  return value as string;
};

export const getAuthUrl = () => getEnvValue("VITE_AUTH_URL").replace(/\/$/, "");
export const getHasuraUrl = () => getEnvValue("VITE_HASURA_URL");
export const getHasuraAdminSecret = () => getEnvValue("VITE_HASURA_ADMIN_SECRET");
