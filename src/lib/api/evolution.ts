import { getEvolutionApiKey, getEvolutionApiUrl, getEvolutionInstance } from "@/lib/env";

export interface SendEvolutionTextPayload {
  number: string;
  text: string;
}

export const sendEvolutionTextRequest = async (payload: SendEvolutionTextPayload) => {
  const response = await fetch(`${getEvolutionApiUrl()}/message/sendText/${getEvolutionInstance()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: getEvolutionApiKey(),
    },
    body: JSON.stringify({
      number: payload.number,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar mensagem via Evolution API (${response.status}): ${body || "sem detalhes"}`);
  }

  return response.json();
};
