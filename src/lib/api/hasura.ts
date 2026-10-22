import { getHasuraAdminSecret, getHasuraUrl } from "@/lib/env";

type HasuraResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export type HasuraRequestOptions = {
  query: string;
  variables?: Record<string, unknown>;
  token?: string | null;
};

export const hasuraRequest = async <T>({
  query,
  variables,
  token,
}: HasuraRequestOptions): Promise<T> => {
  const response = await fetch(getHasuraUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": getHasuraAdminSecret(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as HasuraResponse<T>;
  // Compatibilidade durante o rollout: leituras continuam funcionando antes do SQL.
  // Nunca remover campos de uma mutation: isso poderia descartar uma edição do usuário.
  if (payload.errors?.some((error) => /field 'email_financeiro' not found/.test(error.message)) &&
      /^\s*query\b/.test(query) && /^\s*email_financeiro\s*$/m.test(query)) {
    return hasuraRequest<T>({ query: query.replace(/^\s*email_financeiro\s*$/gm, ""), variables, token });
  }
  if (!response.ok || payload.errors?.length) {
    const rawMessage = payload.errors?.map((error) => error.message).join(", ") || response.statusText;
    const message = /email_financeiro.*not found/.test(rawMessage)
      ? "O campo de e-mail financeiro ainda não está habilitado no Hasura. Aplique o SQL 2026-10-22-email-financeiro.sql e atualize o schema/permissões antes de salvar esse campo."
      : rawMessage;
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Resposta sem dados do Hasura.");
  }

  return payload.data;
};
