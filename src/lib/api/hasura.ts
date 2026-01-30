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
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((error) => error.message).join(", ") || response.statusText;
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Resposta sem dados do Hasura.");
  }

  return payload.data;
};
