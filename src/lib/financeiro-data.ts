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
      empresa: "Estilo Nordeste Ltda",
      valor: 600,
      vencimento: "10/12/2024",
      status: "Atrasado",
      competenciaInicial: "12/2024",
      competenciaFinal: "12/2024",
      faixa: "1-20",
    },
    {
      id: "b2",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Costura Viva",
      valor: 850,
      vencimento: "15/11/2024",
      status: "Atrasado",
      competenciaInicial: "11/2024",
      competenciaFinal: "11/2024",
      faixa: "21-50",
    },
    {
      id: "b3",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Confecções Aurora",
      valor: 600,
      vencimento: "20/01/2026",
      status: "Pago",
      competenciaInicial: "01/2026",
      competenciaFinal: "01/2026",
      faixa: "1-20",
    },
    {
      id: "b4",
      tipo: "Contribuição Assistencial",
      empresa: "ModaSul Indústria e Comércio S.A.",
      ano: "2025",
      periodicidade: "Mensal",
      parcelas: 3,
      base: 20000,
      percentual: 1.5,
      descontos: 0,
      valor: 300,
      vencimento: "30/01/2026",
      status: "Pendente",
    },
    {
      id: "b5",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Têxtil Nordeste",
      valor: 600,
      vencimento: "05/01/2026",
      status: "Pendente",
      competenciaInicial: "01/2026",
      competenciaFinal: "01/2026",
      faixa: "1-20",
    },
    {
      id: "b6",
      tipo: "Mensalidade (por Faixa)",
      empresa: "Estilo Nordeste Ltda",
      valor: 600,
      vencimento: "10/01/2026",
      status: "Pago",
      competenciaInicial: "01/2026",
      competenciaFinal: "01/2026",
      faixa: "1-20",
    },
    {
      id: "b7",
      tipo: "Contribuição Assistencial",
      empresa: "Confecções Aurora",
      ano: "2025",
      periodicidade: "Anual",
      parcelas: 1,
      base: 15000,
      percentual: 2,
      descontos: 50,
      valor: 250,
      vencimento: "15/10/2024",
      status: "Atrasado",
    },
    {
      id: "b8",
      tipo: "Mensalidade (por Faixa)",
      empresa: "ModaSul Indústria e Comércio S.A.",
      valor: 850,
      vencimento: "25/02/2026",
      status: "Pendente",
      competenciaInicial: "02/2026",
      competenciaFinal: "02/2026",
      faixa: "21-50",
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
