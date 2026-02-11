import { getAuthUrl } from "@/lib/env";

export type EfiCreateBoletoPayload = {
  tipo: "mensalidade" | "contribuicao" | "";
  empresaId: string;
  empresaNome: string;
  competenciaInicial: string;
  competenciaFinal: string;
  dataVencimento: string;
  faixaId: string;
  unificarCompetencias: string;
  mensagemPersonalizada: string;
  anoContribuicao: string;
  periodicidade: string;
  parcelas: string;
  baseCalculo: string;
  percentual: string;
  descontos: string;
  valorCalculado: number;
  pesquisaContribuicaoFeita: boolean;
};

type EfiBridgeBoleto = {
  efi_charge_id?: string;
  status_ui?: string;
  status_efi_raw?: string;
  valor?: number | string;
  vencimento?: string;
  linha_digitavel?: string;
  pdf_url?: string;
  link_boleto?: string;
};

type EfiBridgeCreateResponse = {
  ok?: boolean;
  boleto?: EfiBridgeBoleto;
  data?: {
    boleto?: EfiBridgeBoleto;
  };
  message?: string;
};

export const createEfiBoletoRequest = async (
  payload: EfiCreateBoletoPayload,
  token: string,
): Promise<EfiBridgeBoleto> => {
  const response = await fetch(`${getAuthUrl()}/api/efi/boletos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as EfiBridgeCreateResponse;

  if (!response.ok) {
    throw new Error(body.message || "Falha ao criar boleto na integração com EFI.");
  }

  return body.boleto ?? body.data?.boleto ?? {};
};
