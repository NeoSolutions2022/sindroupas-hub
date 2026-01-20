// Tipos centralizados para o Dashboard

export interface Empresa {
  id: number;
  nome: string;
  logo: string;
  situacao: string;
  engajamento: number;
  beneficiosNaoUtilizados: string[];
  proximoAniversario: string;
  proximoBoleto: {
    data: string;
    status: string;
    descricao: string;
  };
  responsavel: {
    nome: string;
    whatsapp: string;
    aniversario?: string;
  } | null;
  colaboradores: { nome: string; whatsapp: string }[];
  whatsapp: string;
  faixa: string;
  porte: string;
  associada: boolean;
  multiplosAtrasos: number;
  diasInadimplente: number;
  capitalSocial: number;
  dataFundacao: string;
  aniversarioEmpresa: string;
  aniversarioResponsavel?: string;
  tags: string[];
  historico: string[];
  observacaoPadrao: string;
  valorEmAberto?: number;
  ultimoContato?: string;
}

export interface PrioridadeItem extends Empresa {
  score: number;
  motivo: string;
  selo: "Crítico" | "Atenção" | "Oportunidade";
  recomendacao: string;
  chips: string[];
}

export interface AgendaItem {
  tipo: "responsavel" | "empresa";
  nome: string;
  empresa?: string;
  data: string;
  whatsapp?: string;
  sugestaoMensagem: string;
}

export interface KPI {
  label: string;
  valor: string | number;
  variacao?: string;
  variacaoTipo?: "positivo" | "negativo" | "neutro";
  icone?: string;
}

export type PeriodoFiltro = "hoje" | "7dias" | "30dias";
