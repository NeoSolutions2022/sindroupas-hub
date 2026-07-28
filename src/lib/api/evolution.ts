import { getEvolutionApiKey, getEvolutionApiUrl, getEvolutionInstance } from "@/lib/env";

export interface SendEvolutionTextPayload {
  number: string;
  text: string;
}

/**
 * Converte telefones brasileiros para o formato esperado pela Evolution API:
 * 55 + DDD + número, somente com dígitos.
 */
export const normalizeBrazilianWhatsappNumber = (number: string) => {
  const digits = number.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }

  throw new Error("WhatsApp inválido. Informe o DDD e o número brasileiro com 10 ou 11 dígitos.");
};

export const sendEvolutionTextRequest = async (payload: SendEvolutionTextPayload) => {
  const number = normalizeBrazilianWhatsappNumber(payload.number);

  const response = await fetch(`${getEvolutionApiUrl()}/message/sendText/${getEvolutionInstance()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: getEvolutionApiKey(),
    },
    body: JSON.stringify({
      number,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar mensagem via Evolution API (${response.status}): ${body || "sem detalhes"}`);
  }

  return response.json();
};
