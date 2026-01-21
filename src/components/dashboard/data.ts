import { Empresa, AgendaItem } from "./types";

// Dados mock das empresas com campos adicionais para o novo dashboard
export const empresas: Empresa[] = [
  {
    id: 1,
    nome: "Estilo Nordeste",
    logo: "",
    situacao: "Inadimplente",
    engajamento: 42,
    beneficiosNaoUtilizados: ["Mentoria ESG"],
    proximoAniversario: "2025-04-15",
    proximoBoleto: { data: "2025-04-10", status: "Em atraso", descricao: "Boleto março/25" },
    responsavel: { nome: "Lúcia Costa", whatsapp: "5585992763253", aniversario: "2025-04-22" },
    colaboradores: [{ nome: "Marcelo Dias", whatsapp: "55999887766" }],
    whatsapp: "5585992763253",
    faixa: "Premium",
    porte: "Médio",
    associada: true,
    multiplosAtrasos: 3,
    diasInadimplente: 70,
    capitalSocial: 500000,
    dataFundacao: "2013-04-15",
    aniversarioEmpresa: "2025-04-15",
    aniversarioResponsavel: "2025-04-22",
    tags: ["2 meses de atraso, contatar!", "Atualizar cadastro!"],
    historico: ["2 boletos em atraso", "Associação desde 2014"],
    observacaoPadrao: "Contato pendente com financeiro.",
    valorEmAberto: 4500,
    ultimoContato: "2024-11-15",
  },
  {
    id: 2,
    nome: "Costura Viva",
    logo: "",
    situacao: "Regular",
    engajamento: 58,
    beneficiosNaoUtilizados: [],
    proximoAniversario: "2025-04-03",
    proximoBoleto: { data: "2025-04-28", status: "A vencer", descricao: "Mensalidade abril/25" },
    responsavel: { nome: "Ana Pires", whatsapp: "", aniversario: "2025-06-12" },
    colaboradores: [],
    whatsapp: "5585987654321",
    faixa: "Essencial",
    porte: "Pequeno",
    associada: true,
    multiplosAtrasos: 2,
    diasInadimplente: 0,
    capitalSocial: 150000,
    dataFundacao: "2019-02-10",
    aniversarioEmpresa: "2025-04-03",
    aniversarioResponsavel: "2025-06-12",
    tags: ["Responsável sem WhatsApp", "Completar dados da empresa"],
    historico: ["Sem atrasos recentes", "Participou do Fórum 2024"],
    observacaoPadrao: "Enviar guia de benefícios digitais.",
    valorEmAberto: 850,
    ultimoContato: "2025-01-10",
  },
  {
    id: 3,
    nome: "Confecções Aurora",
    logo: "",
    situacao: "Regular",
    engajamento: 91,
    beneficiosNaoUtilizados: ["Programa de Exportação"],
    proximoAniversario: "2025-06-18",
    proximoBoleto: { data: "2025-01-22", status: "A vencer", descricao: "Mensalidade jan/26" },
    responsavel: { nome: "Renato Souza", whatsapp: "558899772211", aniversario: "2025-01-22" },
    colaboradores: [{ nome: "Paula Sanches", whatsapp: "558899221177" }],
    whatsapp: "558899772211",
    faixa: "Premium",
    porte: "Grande",
    associada: true,
    multiplosAtrasos: 0,
    diasInadimplente: 0,
    capitalSocial: 1200000,
    dataFundacao: "2012-04-22",
    aniversarioEmpresa: "2025-04-22",
    aniversarioResponsavel: "2025-01-22",
    tags: ["Atualizar cadastro!"],
    historico: ["Associação desde 2010"],
    observacaoPadrao: "Enviar convite para missão empresarial.",
    valorEmAberto: 0,
    ultimoContato: "2025-01-18",
  },
  {
    id: 4,
    nome: "Moda Sul",
    logo: "",
    situacao: "Inadimplente",
    engajamento: 47,
    beneficiosNaoUtilizados: ["Hub de Inovação"],
    proximoAniversario: "2025-04-22",
    proximoBoleto: { data: "2025-04-05", status: "Em atraso", descricao: "Mensalidade fevereiro/25" },
    responsavel: { nome: "Bruno Lima", whatsapp: "", aniversario: "2025-04-22" },
    colaboradores: [{ nome: "Sara Nunes", whatsapp: "55988123000" }],
    whatsapp: "55988123000",
    faixa: "Essencial",
    porte: "Médio",
    associada: false,
    multiplosAtrasos: 1,
    diasInadimplente: 35,
    capitalSocial: 230000,
    dataFundacao: "2015-04-22",
    aniversarioEmpresa: "2025-04-22",
    aniversarioResponsavel: "2025-04-22",
    tags: ["2 meses de atraso, contatar!", "Responsável sem WhatsApp"],
    historico: ["1 boleto em atraso", "Associação cancelada em 2023"],
    observacaoPadrao: "Confirmar retomada de associação.",
    valorEmAberto: 1680,
    ultimoContato: "2024-10-05",
  },
  {
    id: 5,
    nome: "Trama Nobre",
    logo: "",
    situacao: "Regular",
    engajamento: 76,
    beneficiosNaoUtilizados: [],
    proximoAniversario: "2025-05-02",
    proximoBoleto: { data: "2025-04-30", status: "A vencer", descricao: "Mensalidade abril/25" },
    responsavel: null,
    colaboradores: [{ nome: "Felipe Duarte", whatsapp: "" }],
    whatsapp: "",
    faixa: "Expansão",
    porte: "Pequeno",
    associada: false,
    multiplosAtrasos: 0,
    diasInadimplente: 0,
    capitalSocial: 0,
    dataFundacao: "",
    aniversarioEmpresa: "2025-05-02",
    aniversarioResponsavel: undefined,
    tags: ["Completar dados da empresa"],
    historico: ["Sem histórico crítico"],
    observacaoPadrao: "Solicitar envio de logomarca.",
    valorEmAberto: 0,
    ultimoContato: undefined,
  },
];

// KPIs do dashboard - NOVO formato operacional
export const dashboardKPIs = {
  inadimplencia: 9.3,
  inadimplenciaVariacao: -1.2,
  totalFaturadoMes: 125400,
  totalFaturadoVariacao: 3.8,
  valorEmAtraso: 32800,
  qtdBoletosVencidos: 49,
  empresasCriticas: 4,
  proximosVencimentos15d: 12,
  // Removido: proximosEventos7d
  empresasAtivas: 134,
  empresasInadimplentes: 21,
  empresasEmDia: 113,
  boletosEmAtraso: 49,
};

// Resumo da carteira
export const carteiraResumo = {
  boletosEmAtraso: 49,
  empresasInadimplentes: 21,
  empresasEmDia: 113,
};

// Empresas com dados incompletos
export const empresasIncompletas = [
  { id: 4, nome: "Moda Sul", missingFields: ["whatsapp", "aniversarioResponsavel"] },
  { id: 5, nome: "Trama Nobre", missingFields: ["responsavel", "dataFundacao", "logo"] },
  { id: 6, nome: "Têxtil Norte", missingFields: ["whatsapp"] },
  { id: 7, nome: "Confecções Litoral", missingFields: ["aniversarioResponsavel", "logo"] },
  { id: 8, nome: "Malhas Premium", missingFields: ["dataFundacao"] },
  { id: 9, nome: "Estamparia Central", missingFields: ["responsavel", "whatsapp"] },
];

// Eventos do calendário mensal
export const calendarEvents = [
  { date: "2026-01-22", type: "vencimento" as const, label: "Vencimento", detail: "Estilo Nordeste (R$ 600)" },
  { date: "2026-01-22", type: "aniversario" as const, label: "Aniversário do responsável", detail: "Renato Souza" },
  { date: "2026-01-23", type: "vencimento" as const, label: "Vencimento", detail: "Costura Viva (R$ 850)" },
  { date: "2026-01-24", type: "aniversario" as const, label: "Aniversário do responsável", detail: "Lúcia Costa" },
  { date: "2026-01-25", type: "vencimento" as const, label: "Vencimento", detail: "Confecções Aurora (R$ 600)" },
  { date: "2026-01-25", type: "aniversario" as const, label: "Aniversário de fundação", detail: "Confecções Aurora" },
  { date: "2026-01-28", type: "vencimento" as const, label: "Vencimento", detail: "Moda Sul (R$ 480)" },
  { date: "2026-01-15", type: "atrasado" as const, label: "Atrasado", detail: "Estilo Nordeste (R$ 600) - 6 dias" },
  { date: "2026-01-10", type: "atrasado" as const, label: "Atrasado", detail: "Moda Sul (R$ 480) - 11 dias" },
  { date: "2026-02-03", type: "aniversario" as const, label: "Aniversário de fundação", detail: "Costura Viva" },
  { date: "2026-02-10", type: "vencimento" as const, label: "Vencimento", detail: "Trama Nobre (R$ 720)" },
  { date: "2026-02-15", type: "vencimento" as const, label: "Vencimento", detail: "Estilo Nordeste (R$ 600)" },
];

// Prioridades operacionais (ordenadas por data)
export const prioridadesOperacionais = [
  {
    id: 1,
    nome: "Estilo Nordeste",
    tipo: "boleto" as const,
    contexto: "Atraso 70d • 3 boletos",
    chips: [
      { label: "Vencido há 70 dias", tipo: "critico" as const },
      { label: "Crítico", tipo: "critico" as const },
    ],
  },
  {
    id: 4,
    nome: "Moda Sul",
    tipo: "boleto" as const,
    contexto: "Atraso 35d • 1 boleto",
    chips: [
      { label: "Vencido há 35 dias", tipo: "atencao" as const },
    ],
  },
  {
    id: 3,
    nome: "Confecções Aurora",
    tipo: "aniversario" as const,
    contexto: "Aniversário de fundação em 3 dias",
    chips: [
      { label: "Aniversário", tipo: "aniversario" as const },
      { label: "Vence em 3 dias", tipo: "neutro" as const },
    ],
  },
  {
    id: 2,
    nome: "Costura Viva",
    tipo: "boleto" as const,
    contexto: "Vence em 2 dias",
    chips: [
      { label: "Vence em 2 dias", tipo: "atencao" as const },
    ],
  },
  {
    id: 5,
    nome: "Trama Nobre",
    tipo: "boleto" as const,
    contexto: "Vence hoje",
    chips: [
      { label: "Vence hoje", tipo: "atencao" as const },
    ],
  },
];

// Próximos vencimentos (15 dias)
export const proximosVencimentos = [
  { empresa: "Estilo Nordeste", data: "2025-01-22", valor: 600, status: "Hoje", whatsapp: "5585992763253" },
  { empresa: "Costura Viva", data: "2025-01-23", valor: 850, status: "A vencer", whatsapp: "5585987654321" },
  { empresa: "Confecções Aurora", data: "2025-01-25", valor: 600, status: "A vencer", whatsapp: "558899772211" },
  { empresa: "Moda Sul", data: "2025-01-28", valor: 480, status: "A vencer", whatsapp: "55988123000" },
];

// Agenda de relacionamento (próximos 7 dias)
export const agendaRelacionamento: AgendaItem[] = [
  {
    tipo: "responsavel",
    nome: "Renato Souza",
    empresa: "Confecções Aurora",
    data: "2025-01-22",
    whatsapp: "558899772211",
    sugestaoMensagem: "Olá Renato! A equipe SindRoupas deseja um feliz aniversário! 🎂",
  },
  {
    tipo: "responsavel",
    nome: "Lúcia Costa",
    empresa: "Estilo Nordeste",
    data: "2025-01-24",
    whatsapp: "5585992763253",
    sugestaoMensagem: "Olá Lúcia! Parabéns pelo seu aniversário! A família SindRoupas agradece a parceria! 🎉",
  },
  {
    tipo: "empresa",
    nome: "Confecções Aurora",
    data: "2025-01-25",
    whatsapp: "558899772211",
    sugestaoMensagem: "Parabéns pelos 13 anos da Confecções Aurora! É uma honra tê-los como associados! 🎊",
  },
];

// Mapa de inadimplência por faixa
export const mapaInadimplencia = [
  { faixa: "0-7 dias", quantidade: 8, valor: 4800 },
  { faixa: "8-30 dias", quantidade: 9, valor: 8200 },
  { faixa: "31-60 dias", quantidade: 6, valor: 11800 },
  { faixa: "60+ dias", quantidade: 4, valor: 8000 },
];

// Entradas e saídas (gráfico simplificado)
export const entradasSaidas = [
  { mes: "Set", receitas: 118000, despesas: 35000 },
  { mes: "Out", receitas: 125400, despesas: 36000 },
  { mes: "Nov", receitas: 122800, despesas: 34500 },
  { mes: "Dez", receitas: 130200, despesas: 38000 },
  { mes: "Jan", receitas: 128500, despesas: 36500 },
];
