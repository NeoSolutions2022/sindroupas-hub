export type BoletoTipo = "Mensalidade (por Faixa)" | "Contribuição Assistencial";

export interface BoletoRegistro {
  id: string;
  tipo: BoletoTipo;
  empresa: string;
  valor: number;
  vencimento: string;
  status: string;
  competenciaInicial?: string;
  competenciaFinal?: string;
  faixa?: string;
  ano?: string;
  periodicidade?: string;
  parcelas?: number;
  base?: number;
  percentual?: number;
  descontos?: number;
}

export interface HistoricoContribuicao {
  id: string;
  ano: string;
  empresa: string;
  periodicidade: string;
  parcelas: number;
  base: number;
  percentual: number;
  descontos: number;
  valor: number;
  vencimento: string;
  situacao: string;
}

interface FinanceiroDataState {
  boletos: BoletoRegistro[];
  historico: HistoricoContribuicao[];
}

const defaultData: FinanceiroDataState = {
  boletos: [
    {
      id: "b1",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Estilo Nordeste",
      valor: 450,
      vencimento: "10/03/2025",
      status: "Pago",
      competenciaInicial: "01/2025",
      competenciaFinal: "01/2025",
      faixa: "1-20",
    },
    {
      id: "b2",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Costura Viva",
      valor: 450,
      vencimento: "15/03/2025",
      status: "Atrasado",
      competenciaInicial: "01/2025",
      competenciaFinal: "01/2025",
      faixa: "1-20",
    },
    {
      id: "b3",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Confecções Aurora",
      valor: 450,
      vencimento: "20/03/2025",
      status: "Pago",
      competenciaInicial: "01/2025",
      competenciaFinal: "01/2025",
      faixa: "1-20",
    },
    {
      id: "b4",
      tipo: "Contribuição Assistencial",
      empresa: "ModaSul S.A.",
      ano: "2025",
      periodicidade: "Mensal",
      parcelas: 3,
      base: 20000,
      percentual: 1.5,
      descontos: 0,
      valor: 300,
      vencimento: "30/11/2025",
      status: "Emitida",
    },
  ],
  historico: [
    {
      id: "h1",
      ano: "2025",
      empresa: "ModaSul S.A.",
      periodicidade: "Mensal",
      parcelas: 3,
      base: 20000,
      percentual: 1.5,
      descontos: 0,
      valor: 300,
      vencimento: "30/11/2025",
      situacao: "Emitida",
    },
  ],
};

const STORAGE_KEY = "financeiroData";

const isBrowser = typeof window !== "undefined";

const readStorage = (): FinanceiroDataState | null => {
  if (!isBrowser) return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as FinanceiroDataState;
  } catch (error) {
    console.error("Erro ao ler dados do financeiro:", error);
    return null;
  }
};

const persistStorage = (data: FinanceiroDataState) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getFinanceiroData = (): FinanceiroDataState => {
  return readStorage() || defaultData;
};

export const saveFinanceiroData = (data: FinanceiroDataState) => {
  persistStorage(data);
};
