import { getBoletosApiUrl } from "@/lib/env";

type BoletoCustomerPF = {
  name: string;
  cpf: string;
  email: string;
  phone_number: string;
};

type BoletoCustomerPJ = {
  email: string;
  phone_number: string;
  juridical_person: {
    corporate_name: string;
    cnpj: string;
  };
};

type CreateBoletoPayload = {
  empresa_id?: string;
  tipo?: string;
  valor: number;
  vencimento: string;
  descricao?: string;
  competencia_inicial?: string;
  competencia_final?: string;
  ano?: string;
  periodicidade?: number;
  parcelas?: number;
  descontos?: number;
  percentual?: number;
  base?: number;
  item_name?: string;
  item_amount?: number;
  custom_id?: string;
  message?: string;
  customer: BoletoCustomerPF | BoletoCustomerPJ;
};

type CreateBoletoSuccessResponse = {
  ok: true;
  efi?: {
    code?: number;
    data?: {
      charge_id?: number;
      status?: string;
      barcode?: string;
      link?: string;
      billet_link?: string;
      pdf?: { charge?: string };
    };
  };
};

type CreateBoletoErrorResponse = {
  ok: false;
  stage?: "efi" | "hasura";
  status_code?: number;
  efi?: {
    code?: number;
    error?: string;
    data?: {
      charge_id?: number;
    };
  };
  hasura?: {
    errors?: { message?: string }[];
  };
};

type CreateBoletoResponse = CreateBoletoSuccessResponse | CreateBoletoErrorResponse;

const extractErrorMessage = (payload: CreateBoletoErrorResponse) => {
  if (payload.stage === "efi" && payload.efi?.error) {
    return `Falha na criação do boleto na EFI: ${payload.efi.error}`;
  }

  if (payload.stage === "hasura" && payload.hasura?.errors?.length) {
    const firstError = payload.hasura.errors[0]?.message;
    if (firstError) {
      return `Boleto criado na EFI, mas falhou ao persistir no Hasura: ${firstError}`;
    }
  }

  return "Falha ao criar boleto na nova API.";
};

export const createBoletoRequest = async (payload: CreateBoletoPayload) => {
  const response = await fetch(`${getBoletosApiUrl()}/boletos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as CreateBoletoResponse;

  if (!response.ok || !body.ok) {
    throw new Error(extractErrorMessage(body as CreateBoletoErrorResponse));
  }

  return body;
};

export const getBoletoByChargeIdRequest = async (chargeId: number) => {
  const response = await fetch(`${getBoletosApiUrl()}/boletos/${chargeId}`);
  if (!response.ok) throw new Error("Falha ao consultar boleto.");
  return response.json();
};

export const cancelBoletoRequest = async (chargeId: number) => {
  const response = await fetch(`${getBoletosApiUrl()}/boletos/${chargeId}/cancelar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Falha ao cancelar boleto.");
  return response.json();
};

export const updateBoletoDueDateRequest = async (chargeId: number, vencimento: string) => {
  const response = await fetch(`${getBoletosApiUrl()}/boletos/${chargeId}/vencimento`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ charge_id: chargeId, vencimento }),
  });
  if (!response.ok) throw new Error("Falha ao alterar vencimento.");
  return response.json();
};

export type { CreateBoletoPayload };
