import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowRight,
  BadgeInfo,
  BarChart3,
  Building2,
  CalendarClock,
  ChartNoAxesColumn,
  CircleAlert,
  Cake,
  ListChecks,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Users,
  Flame,
  PhoneOff,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Dashboard data
const dashboardData = {
  kpis: {
    receitaMes: 125400,
    boletosPagos: 182,
    boletosEmitidosMes: 210,
    boletosEmAberto: 28,
    boletosVencidos: 8,
    inadimplenciaPercentual: 9.3,
    empresasAtivas: 134,
    empresasInadimplentes: 21,
  },
  entradasSaidas: [
    { mes: "Mai", receitas: 90000, despesas: 30000 },
    { mes: "Jun", receitas: 98000, despesas: 31000 },
    { mes: "Jul", receitas: 102000, despesas: 32000 },
    { mes: "Ago", receitas: 110500, despesas: 34000 },
    { mes: "Set", receitas: 118000, despesas: 35000 },
    { mes: "Out", receitas: 125400, despesas: 36000 },
  ],
  inadimplencia: {
    empresasInadimplentes: 21,
    casosAcima60d: 4,
    valorTotalAtraso: 32800,
    parcelasAtrasadas: 49,
    topRisco: [
      { empresa: "Estilo Nordeste", parcelas: 3, valor: 4500 },
      { empresa: "Costura Viva", parcelas: 2, valor: 3200 },
      { empresa: "Confecções Aurora", parcelas: 2, valor: 2900 },
    ],
  },
  proximosVencimentos: [
    { empresa: "Estilo Nordeste", data: "2025-11-10", valor: 600, status: "A vencer" },
    { empresa: "Costura Viva", data: "2025-11-12", valor: 850, status: "A vencer" },
    { empresa: "Confecções Aurora", data: "2025-11-08", valor: 600, status: "Hoje" },
  ],
};

const crmResumo = {
  aniversariantesSemana: [
    { tipo: "empresa", nome: "Estilo Nordeste", data: "2025-04-15" },
    { tipo: "responsavel", nome: "Bruno Lima", empresa: "ModaSul", data: "2025-04-22" },
  ],
  tagsAtencao: {
    atraso2meses: 4,
    atualizarCadastro: 6,
  },
  cadastrosIncompletos: 12,
};

// CRM data
const crmHighlights = {
  aniversariosMes: [
    { tipo: "empresa", nome: "Estilo Nordeste", data: "2025-04-15" },
    { tipo: "responsavel", nome: "Bruno Lima", empresa: "Moda Sul", data: "2025-04-22" },
    { tipo: "responsavel", nome: "Juliana Costa", empresa: "Costura Viva", data: "2025-04-03" }
  ],
  fundacoes: [
    { empresa: "Confecções Aurora", anos: 12, data: "2025-04-22" },
    { empresa: "Trama Nobre", anos: 5, data: "2025-05-02" }
  ],
  casosCriticos60d: 2
};

const empresas = [
  {
    id: 1,
    nome: "Estilo Nordeste",
    logo: "",
    situacao: "Inadimplente",
    engajamento: 42,
    beneficiosNaoUtilizados: ["Mentoria ESG"],
    proximoAniversario: "2025-04-15",
    proximoBoleto: { data: "2025-04-10", status: "Em atraso", descricao: "Boleto março/25" },
    responsavel: { nome: "Lúcia Costa", whatsapp: "5585992763253" },
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
    observacaoPadrao: "Contato pendente com financeiro."
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
    responsavel: { nome: "Ana Pires", whatsapp: "" },
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
    observacaoPadrao: "Enviar guia de benefícios digitais."
  },
  {
    id: 3,
    nome: "Confecções Aurora",
    logo: "",
    situacao: "Regular",
    engajamento: 91,
    beneficiosNaoUtilizados: ["Programa de Exportação"],
    proximoAniversario: "2025-06-18",
    proximoBoleto: { data: "2025-04-18", status: "A vencer", descricao: "Mensalidade abril/25" },
    responsavel: { nome: "Renato Souza", whatsapp: "558899772211" },
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
    aniversarioResponsavel: "2025-01-10",
    tags: ["Atualizar cadastro!"],
    historico: ["Associação desde 2010"],
    observacaoPadrao: "Enviar convite para missão empresarial."
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
    responsavel: { nome: "Bruno Lima", whatsapp: "" },
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
    observacaoPadrao: "Confirmar retomada de associação."
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
    observacaoPadrao: "Solicitar envio de logomarca."
  }
];

// Utility functions
const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getToday = () => new Date();
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const differenceInDays = (dateA: Date, dateB: Date) => {
  const diff = startOfDay(dateA).getTime() - startOfDay(dateB).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const isWithinNextDays = (dateString?: string, days = 7) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  const today = getToday();
  const diff = differenceInDays(target, today);
  return diff >= 0 && diff <= days;
};

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const getMonthCalendar = (events: { data: string }[]) => {
  const today = getToday();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const highlightedDays = events
    .map((event) => new Date(event.data))
    .filter((date) => date.getMonth() === month && date.getFullYear() === year)
    .map((date) => date.getDate());
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  return { cells, highlightedDays };
};

const getResponsavel = (empresa: (typeof empresas)[number]) => {
  if (empresa.responsavel) return empresa.responsavel;
  return empresa.colaboradores[0] ?? null;
};

const formatWhatsappDisplay = (value?: string) => {
  if (!value) return "Sem WhatsApp";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return value;
  const sanitized = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = sanitized.slice(0, 2);
  const numberPart = sanitized.slice(2);
  if (numberPart.length === 9) return `(${ddd}) ${numberPart.slice(0, 5)}-${numberPart.slice(5)}`;
  if (numberPart.length === 8) return `(${ddd}) ${numberPart.slice(0, 4)}-${numberPart.slice(4)}`;
  return `+${digits}`;
};

const getWhatsappLink = (value?: string) => {
  if (!value) return undefined;
  return `https://wa.me/${value}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const inadimplenciaPercentual =
    (dashboardData.kpis.empresasInadimplentes / dashboardData.kpis.empresasAtivas) * 100;

  // CRM State
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [associacaoFilter, setAssociacaoFilter] = useState<string | undefined>();
  const [porteFilter, setPorteFilter] = useState<string | undefined>();
  const [faixaFilter, setFaixaFilter] = useState<string | undefined>();
  const [selectedCompany, setSelectedCompany] = useState<(typeof empresas)[number] | null>(null);
  const [notesCompany, setNotesCompany] = useState<(typeof empresas)[number] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    empresas.forEach((empresa) => { initial[empresa.id] = empresa.observacaoPadrao ?? ""; });
    return initial;
  });
  const [notesDraft, setNotesDraft] = useState("");

  const openDetailModal = (empresa: (typeof empresas)[number]) => setSelectedCompany(empresa);
  const closeDetailModal = () => setSelectedCompany(null);
  const openNotesModal = (empresa: (typeof empresas)[number]) => {
    setNotesCompany(empresa);
    setNotesDraft(notes[empresa.id] ?? "");
  };
  const closeNotesModal = () => { setNotesCompany(null); setNotesDraft(""); };
  const handleSaveNotes = () => {
    if (!notesCompany) return;
    setNotes((prev) => ({ ...prev, [notesCompany.id]: notesDraft }));
    closeNotesModal();
  };

  // CRM computed values
  const empresasSemWhatsapp = useMemo(() => {
    return empresas
      .filter((empresa) => { const contato = getResponsavel(empresa); return !contato?.whatsapp; })
      .map((empresa) => ({ empresa: empresa.nome, responsavel: getResponsavel(empresa)?.nome ?? "—" }));
  }, []);

  const dadosIncompletos = useMemo(() => {
    const detalhes = {
      semLogo: empresas.filter((e) => !e.logo).length,
      semResponsavel: empresas.filter((e) => !e.responsavel).length,
      semColaboradores: empresas.filter((e) => e.colaboradores.length === 0).length,
      semCapitalSocial: empresas.filter((e) => !e.capitalSocial).length,
      semPorte: empresas.filter((e) => !e.porte).length,
      semFundacao: empresas.filter((e) => !e.dataFundacao).length,
      semFaixa: empresas.filter((e) => !e.faixa).length
    };
    const total = empresas.filter((e) =>
      !e.logo || !e.responsavel || e.colaboradores.length === 0 || !e.capitalSocial || !e.porte || !e.dataFundacao || !e.faixa
    ).length;
    return { total, detalhes };
  }, []);

  const companiesWithMultipleDelays = useMemo(() => {
    return empresas
      .filter((e) => (e.multiplosAtrasos ?? 0) >= 2)
      .map((e) => ({ empresa: e.nome, atrasos: e.multiplosAtrasos }));
  }, []);

  const inadimplentesCriticos = useMemo(() => empresas.filter((e) => e.diasInadimplente > 60).length, []);

  const { cells: calendarCells, highlightedDays } = useMemo(() => getMonthCalendar(crmHighlights.aniversariosMes), []);

  const proximosAniversariosSemana = useMemo(() => {
    return crmHighlights.aniversariosMes
      .filter((evento) => isWithinNextDays(evento.data, 7))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, []);

  const aniversariosHoje = proximosAniversariosSemana.filter((evento) => {
    const hoje = startOfDay(getToday());
    const dataEvento = startOfDay(new Date(evento.data));
    return hoje.getTime() === dataEvento.getTime();
  });

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) => prev.includes(filterId) ? prev.filter((item) => item !== filterId) : [...prev, filterId]);
  };

  const filteredCompanies = useMemo(() => {
    return empresas.filter((empresa) => {
      if (activeFilters.includes("aniversariantesMes")) {
        const aniversario = empresa.proximoAniversario ? new Date(empresa.proximoAniversario) : null;
        if (!aniversario || aniversario.getMonth() !== getToday().getMonth()) return false;
      }
      if (activeFilters.includes("inadimplentes") && empresa.situacao !== "Inadimplente") return false;
      if (activeFilters.includes("multiplosAtrasos") && (empresa.multiplosAtrasos ?? 0) < 2) return false;
      if (activeFilters.includes("responsavelSemWhatsapp") && getResponsavel(empresa)?.whatsapp) return false;
      if (activeFilters.includes("beneficiosNaoUtilizados") && !(empresa.beneficiosNaoUtilizados && empresa.beneficiosNaoUtilizados.length > 0)) return false;
      if (activeFilters.includes("engajamentoBaixo") && empresa.engajamento >= 50) return false;
      if (associacaoFilter && ((associacaoFilter === "Sim" && !empresa.associada) || (associacaoFilter === "Não" && empresa.associada))) return false;
      if (porteFilter && empresa.porte !== porteFilter) return false;
      if (faixaFilter && empresa.faixa !== faixaFilter) return false;
      return true;
    });
  }, [activeFilters, associacaoFilter, porteFilter, faixaFilter]);

  const getPriorityScore = (empresa: (typeof empresas)[number]) => {
    if ((empresa.multiplosAtrasos ?? 0) >= 2) return 1;
    if (empresa.situacao === "Inadimplente") return 2;
    if (isWithinNextDays(empresa.proximoAniversario ?? undefined, 7)) return 3;
    if (empresa.engajamento < 50) return 4;
    return 5;
  };

  const sortedCompanies = useMemo(() => [...filteredCompanies].sort((a, b) => getPriorityScore(a) - getPriorityScore(b)), [filteredCompanies]);

  const filterButtons = [
    { id: "aniversariantesMes", label: "Aniversariantes do mês" },
    { id: "inadimplentes", label: "Inadimplentes" },
    { id: "multiplosAtrasos", label: "Múltiplos atrasos" },
    { id: "responsavelSemWhatsapp", label: "Responsável sem WhatsApp" },
    { id: "beneficiosNaoUtilizados", label: "Benefícios não utilizados" },
    { id: "engajamentoBaixo", label: "Engajamento baixo" }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F7F8F4]">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral financeira e operacional do SindRoupas
              </p>
            </div>

            <Tabs defaultValue="visao-geral" className="w-full">
              <TabsList className="mb-6 bg-[#DCE7CB]">
                <TabsTrigger value="visao-geral" className="data-[state=active]:bg-white">Visão Geral</TabsTrigger>
                <TabsTrigger value="crm" className="data-[state=active]:bg-white">CRM</TabsTrigger>
              </TabsList>

              {/* TAB: Visão Geral */}
              <TabsContent value="visao-geral" className="space-y-6">
                <section aria-label="Indicadores principais" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-[#7E8C5E]" />
                        Receita do mês
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#DCE7CB] text-primary">+18% vs mês anterior</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{formatCurrency(dashboardData.kpis.receitaMes)}</div>
                      <p className="text-xs text-muted-foreground">Dados do Financeiro</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-[#7E8C5E]" />
                        Boletos pagos
                      </CardTitle>
                      <Badge variant="outline" className="text-[#7E8C5E] border-[#7E8C5E] bg-white">de {dashboardData.kpis.boletosEmitidosMes} emitidos</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{dashboardData.kpis.boletosPagos}</div>
                      <p className="text-xs text-muted-foreground">No mês atual</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CircleAlert className="h-4 w-4 text-amber-600" />
                        Boletos em aberto
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#FFF7E6] text-amber-700 border border-amber-200">{dashboardData.kpis.boletosVencidos} vencidos</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{dashboardData.kpis.boletosEmAberto}</div>
                      <p className="text-xs text-muted-foreground">{dashboardData.kpis.boletosVencidos} vencidos • {dashboardData.kpis.boletosEmAberto - dashboardData.kpis.boletosVencidos} a vencer</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Índice de inadimplência
                      </CardTitle>
                      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">Carteira ativa</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-700">{dashboardData.kpis.inadimplenciaPercentual}%</div>
                      <p className="text-xs text-muted-foreground">baseado na carteira ativa de empresas</p>
                    </CardContent>
                  </Card>
                </section>

                <section aria-label="Visão geral financeira" className="grid gap-4 lg:grid-cols-2">
                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <BarChart3 className="h-5 w-5 text-[#7E8C5E]" />
                        Entradas x Saídas (6 meses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80" role="img" aria-label="Gráfico de entradas e saídas dos últimos seis meses">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.entradasSaidas}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E1E8D3" />
                            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString("pt-BR")} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: "#F3F5EC" }} />
                            <Legend />
                            <Bar dataKey="receitas" name="Receitas" fill="#7E8C5E" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="despesas" name="Despesas" fill="#C94D4D" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Building2 className="h-5 w-5 text-[#7E8C5E]" />
                        Resumo da carteira
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-3">
                          <p className="text-xs text-muted-foreground">Empresas associadas ativas</p>
                          <p className="text-2xl font-semibold text-primary">{dashboardData.kpis.empresasAtivas}</p>
                        </div>
                        <div className="rounded-lg border border-[#E1E8D3] bg-[#FFF7E6] p-3">
                          <p className="text-xs text-amber-700">Empresas inadimplentes</p>
                          <p className="text-2xl font-semibold text-amber-700">{dashboardData.kpis.empresasInadimplentes}</p>
                        </div>
                        <div className="rounded-lg border border-[#E1E8D3] bg-white p-3">
                          <p className="text-xs text-muted-foreground">Empresas em dia</p>
                          <p className="text-2xl font-semibold text-green-700">{dashboardData.kpis.empresasAtivas - dashboardData.kpis.empresasInadimplentes}</p>
                        </div>
                        <div className="rounded-lg border border-[#E1E8D3] bg-white p-3">
                          <p className="text-xs text-muted-foreground">Ticket médio mensal</p>
                          <p className="text-xl font-semibold text-primary">R$ 580,00</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Inadimplentes vs Em dia</span>
                          <span>{dashboardData.kpis.empresasInadimplentes} / {dashboardData.kpis.empresasAtivas}</span>
                        </div>
                        <Progress value={inadimplenciaPercentual} className="h-3 bg-[#E1E8D3]" />
                        <p className="text-xs text-muted-foreground">{inadimplenciaPercentual.toFixed(1)}% da carteira está inadimplente</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section aria-label="Resumo de relacionamento (CRM)">
                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-primary">
                          <Users className="h-5 w-5 text-[#7E8C5E]" />
                          Resumo de Relacionamento (CRM)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Destaques rápidos do CRM para atuação imediata da equipe.</p>
                      </div>
                      <Button asChild variant="secondary" className="bg-[#DCE7CB] text-primary">
                        <Link to="/dashboard/crm" aria-label="Abrir CRM completo">
                          Abrir CRM completo
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Cake className="h-4 w-4 text-[#7E8C5E]" />
                          Aniversariantes da semana
                        </div>
                        <p className="text-sm text-muted-foreground">{crmResumo.aniversariantesSemana.length} aniversariantes esta semana</p>
                        <ul className="space-y-2 text-sm">
                          {crmResumo.aniversariantesSemana.slice(0, 3).map((item) => (
                            <li key={`${item.nome}-${item.data}`} className="flex flex-col">
                              <span className="font-medium text-primary">
                                {new Date(item.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} — {item.nome}
                                {item.empresa ? ` (${item.empresa})` : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.tipo === "empresa" ? "empresa" : "responsável"}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-[#E1E8D3] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <ListChecks className="h-4 w-4 text-[#7E8C5E]" />
                          Tags de atenção
                        </div>
                        <div className="space-y-2 text-sm text-primary">
                          <div className="flex items-center justify-between rounded-md bg-[#F7F8F4] px-3 py-2">
                            <span className="text-muted-foreground">"2 meses de atraso, contatar!"</span>
                            <span className="font-semibold">{crmResumo.tagsAtencao.atraso2meses} empresas</span>
                          </div>
                          <div className="flex items-center justify-between rounded-md bg-[#F7F8F4] px-3 py-2">
                            <span className="text-muted-foreground">"Atualizar cadastro!"</span>
                            <span className="font-semibold">{crmResumo.tagsAtencao.atualizarCadastro} empresas</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#E1E8D3] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <BadgeInfo className="h-4 w-4 text-[#7E8C5E]" />
                          Dados de cadastro
                        </div>
                        <p className="text-sm text-primary font-semibold">{crmResumo.cadastrosIncompletos} empresas com dados incompletos</p>
                        <p className="text-sm text-muted-foreground">Consulte o CRM para completar informações.</p>
                        <Button variant="outline" className="w-full justify-center border-[#7E8C5E] text-primary" onClick={() => navigate("/dashboard/crm?filtro=dados-incompletos")}>
                          Ver no CRM
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section aria-label="Mapa de inadimplência" className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2 border-[#E1E8D3] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <ChartNoAxesColumn className="h-5 w-5 text-red-600" />
                        Mapa de Inadimplência
                      </CardTitle>
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100">Risco monitorado</Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Empresas inadimplentes</p>
                            <p className="text-2xl font-semibold text-red-700">{dashboardData.inadimplencia.empresasInadimplentes}</p>
                          </div>
                          <Badge className="bg-red-100 text-red-700" aria-label="Empresas inadimplentes">Carteira</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-[#FFF7E6] px-4 py-3">
                          <div>
                            <p className="text-sm text-amber-700">Casos &gt; 60 dias</p>
                            <p className="text-2xl font-semibold text-amber-700">{dashboardData.inadimplencia.casosAcima60d}</p>
                          </div>
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-white">Prioridade</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Valor total em atraso</p>
                            <p className="text-2xl font-semibold text-primary">{formatCurrency(dashboardData.inadimplencia.valorTotalAtraso)}</p>
                          </div>
                          <Badge variant="secondary" className="bg-[#DCE7CB] text-primary">+ atenção</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Parcelas em atraso</p>
                            <p className="text-2xl font-semibold text-primary">{dashboardData.inadimplencia.parcelasAtrasadas}</p>
                          </div>
                          <Badge variant="outline" className="text-[#7E8C5E] border-[#7E8C5E] bg-white">Financeiro</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-sm font-semibold text-primary">Top 3 empresas em risco</p>
                        <div className="space-y-2">
                          {dashboardData.inadimplencia.topRisco.map((item) => (
                            <div key={item.empresa} className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] px-3 py-2">
                              <div>
                                <p className="font-medium text-primary">{item.empresa}</p>
                                <p className="text-xs text-muted-foreground">{item.parcelas} parcelas em atraso</p>
                              </div>
                              <p className="text-sm font-semibold text-primary">{formatCurrency(item.valor)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild variant="outline" className="border-[#7E8C5E] text-[#1C1C1C]" aria-label="Ver detalhes no Financeiro">
                          <Link to="/dashboard/financeiro">Ver detalhes no Financeiro <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                        <Button variant="secondary" className="bg-[#DCE7CB] text-primary" aria-label="Abrir CRM para casos críticos" onClick={() => navigate("/dashboard/crm")}>
                          Abrir CRM <BadgeInfo className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <CalendarClock className="h-5 w-5 text-[#7E8C5E]" />
                        Próximos vencimentos (15 dias)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-[#E1E8D3]">
                        <Table>
                          <TableHeader className="bg-[#F7F8F4]">
                            <TableRow>
                              <TableHead>Empresa</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Situação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dashboardData.proximosVencimentos.map((item) => (
                              <TableRow key={item.empresa} className="hover:bg-[#F7F8F4]">
                                <TableCell className="font-medium">{item.empresa}</TableCell>
                                <TableCell>{new Date(item.data).toLocaleDateString("pt-BR")}</TableCell>
                                <TableCell>{formatCurrency(item.valor)}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={item.status === "Em atraso" ? "bg-red-50 text-red-700 border border-red-100" : item.status === "Hoje" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-[#DCE7CB] text-primary border border-[#E1E8D3]"}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <Button asChild variant="outline" className="w-full border-[#7E8C5E] text-primary">
                        <Link to="/dashboard/financeiro">Ver todos no Financeiro</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </section>

                <section aria-label="Ações rápidas">
                  <Card className="border-[#E1E8D3] shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5 text-[#7E8C5E]" />
                        Ações rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Button className="flex items-center justify-center gap-2 bg-[#1C1C1C] text-white hover:bg-black" onClick={() => navigate("/dashboard/financeiro?wizard=novo-boleto")} aria-label="Criar boleto">
                          <Layers className="h-4 w-4" />
                          Criar boleto
                        </Button>
                        <Button variant="secondary" className="flex items-center justify-center gap-2 bg-[#DCE7CB] text-primary" onClick={() => navigate("/dashboard/empresas?filtro=inadimplentes")} aria-label="Ver empresas inadimplentes">
                          <CircleAlert className="h-4 w-4" />
                          Ver empresas inadimplentes
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center gap-2 border-[#7E8C5E] text-primary" onClick={() => navigate("/dashboard/crm")} aria-label="Abrir CRM">
                          <BarChart3 className="h-4 w-4" />
                          Abrir CRM
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center gap-2 border-[#7E8C5E] text-primary" onClick={() => navigate("/dashboard/empresas?filtro=dados-incompletos")} aria-label="Atualizar cadastro de empresas">
                          <ArrowRight className="h-4 w-4" />
                          Atualizar cadastro de empresas
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>

              {/* TAB: CRM */}
              <TabsContent value="crm" className="space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7E8C5E]">Central Inteligente de Avisos & Prioridades</p>
                  <h2 className="text-2xl font-bold">CRM - Relacionamento</h2>
                  <p className="text-muted-foreground max-w-3xl">Monitoramento automático da saúde das empresas com alertas inteligentes, filtros contextuais e uma lista priorizada para atuação rápida da equipe SindRoupas.</p>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                  {/* Card 1 - Aniversariantes */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Cake className="h-4 w-4 text-[#7E8C5E]" />
                          Aniversariantes do mês
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Aniversários de empresas e responsáveis (mês atual).</p>
                      </div>
                      {aniversariosHoje.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {aniversariosHoje.map((evento) => (
                            <Badge key={`${evento.nome}-${evento.data}`} className="bg-[#DCE7CB] text-[#1C1C1C]">🎉 Hoje: {evento.nome}{evento.empresa && ` / ${evento.empresa}`}</Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                          {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (<span key={i}>{dia}</span>))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-sm">
                          {calendarCells.map((cell, index) => {
                            if (cell === null) return <div key={`empty-${index}`} className="h-8" />;
                            const isHighlighted = highlightedDays.includes(cell);
                            return (
                              <div key={cell} className={`h-8 flex items-center justify-center rounded-md border text-xs ${isHighlighted ? "border-[#7E8C5E] bg-[#DCE7CB] text-[#1C1C1C] font-semibold" : "border-transparent text-muted-foreground"}`}>{cell}</div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximos aniversários</p>
                        {crmHighlights.aniversariosMes.length === 0 && <p className="text-sm text-muted-foreground">Sem aniversários para este mês.</p>}
                        {crmHighlights.aniversariosMes.map((evento) => (
                          <div key={`${evento.nome}-${evento.data}`} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-[#1C1C1C]">{evento.nome}</span>
                              <p className="text-xs text-muted-foreground">{evento.tipo === "responsavel" ? "Responsável" : "Empresa"}{evento.empresa ? ` • ${evento.empresa}` : ""}</p>
                            </div>
                            <span className="font-semibold text-[#7E8C5E]">{formatDate(evento.data)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2 - Fundações */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#7E8C5E]" />
                        Aniversários de Fundação
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Empresas que completam novo ciclo nos próximos 30 dias.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {crmHighlights.fundacoes.map((fundacao) => (
                        <div key={fundacao.empresa} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{fundacao.empresa}</p>
                            <p className="text-muted-foreground">{fundacao.anos} anos em {formatDate(fundacao.data)}</p>
                          </div>
                          <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">Preparar ação</Badge>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver lista completa de fundações">Ver lista completa</Button>
                    </CardContent>
                  </Card>

                  {/* Card 3 - Inadimplentes */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[#E57373]" />
                        Inadimplentes recentes
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Monitoramento dos últimos 30 dias com foco nos casos críticos.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-[#F5C1C1] bg-[#FDECEC] p-4">
                        <div>
                          <p className="text-base font-semibold text-[#1C1C1C]">Casos &gt; 60 dias</p>
                          <p className="text-xs text-[#8A3A3A]">Ação imediata sugerida pela régua financeira.</p>
                        </div>
                        <Badge className="bg-[#E57373] text-white text-lg px-4 py-2">{inadimplentesCriticos}</Badge>
                      </div>
                      <Button variant="link" className="px-0 text-[#7E8C5E]" asChild aria-label="Ver detalhes no Financeiro">
                        <a href="/dashboard/financeiro" className="font-semibold">Ver detalhes no Financeiro</a>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card 4 - Múltiplos atrasos */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="h-4 w-4 text-[#E57373]" />
                        Múltiplos atrasos (alto risco)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Empresas com 2+ boletos atrasados agrupadas automaticamente.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {companiesWithMultipleDelays.slice(0, 2).map((empresa) => (
                        <div key={empresa.empresa} className="flex items-center justify-between text-sm">
                          <span>{empresa.empresa}</span>
                          <Badge variant="destructive" className="bg-[#E57373] hover:bg-[#d96262]">{empresa.atrasos} atrasos</Badge>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver detalhes de múltiplos atrasos">Ver detalhes</Button>
                    </CardContent>
                  </Card>

                  {/* Card 5 - Sem WhatsApp */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PhoneOff className="h-4 w-4 text-[#7E8C5E]" />
                        Responsáveis sem WhatsApp
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Checagem automática considerando o primeiro colaborador como fallback.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold">{empresasSemWhatsapp.length}</p>
                        <p className="text-sm text-muted-foreground">empresas</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{empresasSemWhatsapp.map((item) => item.empresa).join(", ") || "Todas com WhatsApp"}</div>
                    </CardContent>
                  </Card>

                  {/* Card 6 - Dados incompletos */}
                  <Card className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-[#7E8C5E]" />
                        Dados incompletos
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Checklist automático para garantir cadastros completos.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold">{dadosIncompletos.total}</p>
                        <p className="text-sm text-muted-foreground">empresas com pendências</p>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Sem logo: {dadosIncompletos.detalhes.semLogo}</li>
                        <li>Sem responsável: {dadosIncompletos.detalhes.semResponsavel}</li>
                        <li>Sem colaboradores: {dadosIncompletos.detalhes.semColaboradores}</li>
                        <li>Sem capital social: {dadosIncompletos.detalhes.semCapitalSocial}</li>
                        <li>Sem porte: {dadosIncompletos.detalhes.semPorte}</li>
                        <li>Sem data de fundação: {dadosIncompletos.detalhes.semFundacao}</li>
                        <li>Sem faixa: {dadosIncompletos.detalhes.semFaixa}</li>
                      </ul>
                      <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver pendências de dados">Ver pendências</Button>
                    </CardContent>
                  </Card>
                </section>

                {/* Filtros */}
                <section className="space-y-3">
                  <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#1C1C1C]">Filtros</span>
                        <span className="text-xs text-muted-foreground">Refine a visualização para atuação rápida e contextual.</span>
                      </div>
                      <Button variant="ghost" className="self-start p-0 text-sm font-semibold text-[#1C1C1C] hover:bg-transparent hover:underline" onClick={() => { setActiveFilters([]); setAssociacaoFilter(undefined); setPorteFilter(undefined); setFaixaFilter(undefined); }} aria-label="Limpar filtros">
                        Limpar filtros
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
                      <div className="flex flex-wrap gap-2">
                        {filterButtons.map((filter) => (
                          <Button key={filter.id} variant={activeFilters.includes(filter.id) ? "default" : "outline"} className={activeFilters.includes(filter.id) ? "bg-[#7E8C5E] text-white border-[#7E8C5E] h-9 rounded-full text-xs" : "border-[#CBD5B1] bg-white text-[#1C1C1C] h-9 rounded-full text-xs"} onClick={() => toggleFilter(filter.id)} aria-pressed={activeFilters.includes(filter.id)} aria-label={`Filtro ${filter.label}`}>
                            {filter.label}
                          </Button>
                        ))}
                      </div>
                      <div className="grid w-full gap-3 md:grid-cols-3 xl:w-auto xl:flex">
                        <Select value={associacaoFilter} onValueChange={(value) => setAssociacaoFilter(value === "todas" ? undefined : value)}>
                          <SelectTrigger className="h-9 rounded-full border-[#CBD5B1] bg-white text-sm w-full xl:w-36">
                            <SelectValue placeholder="Associação" />
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            <SelectItem value="Sim">Associadas</SelectItem>
                            <SelectItem value="Não">Não associadas</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={porteFilter} onValueChange={(value) => setPorteFilter(value === "todos" ? undefined : value)}>
                          <SelectTrigger className="h-9 rounded-full border-[#CBD5B1] bg-white text-sm w-full xl:w-32">
                            <SelectValue placeholder="Porte" />
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="Pequeno">Pequeno</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Grande">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={faixaFilter} onValueChange={(value) => setFaixaFilter(value === "todas" ? undefined : value)}>
                          <SelectTrigger className="h-9 rounded-full border-[#CBD5B1] bg-white text-sm w-full xl:w-32">
                            <SelectValue placeholder="Faixa" />
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            <SelectItem value="Essencial">Essencial</SelectItem>
                            <SelectItem value="Expansão">Expansão</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                    <h3 className="text-xl font-semibold">Lista de empresas priorizada</h3>
                    <span className="text-sm text-muted-foreground">Ordenação automática conforme risco e oportunidade</span>
                  </div>
                </section>

                {/* Lista de empresas */}
                <section className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedCompanies.map((empresa) => {
                      const responsavel = getResponsavel(empresa);
                      const isInadimplente = empresa.situacao === "Inadimplente";
                      const boletoCritico = empresa.proximoBoleto.status === "Em atraso";
                      const whatsappLink = getWhatsappLink(empresa.whatsapp);
                      return (
                        <Card key={empresa.id} className="border-[#E1E8D3] shadow-sm bg-white flex flex-col">
                          <CardHeader className="space-y-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-14 w-14 border border-[#E1E8D3]">
                                <AvatarImage src={empresa.logo} alt={empresa.nome} />
                                <AvatarFallback className="bg-[#DCE7CB] text-[#1C1C1C] font-semibold">{empresa.nome.split(" ").slice(0, 2).map((parte) => parte[0]).join("")}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <CardTitle className="text-xl">{empresa.nome}</CardTitle>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge className={isInadimplente ? "bg-[#E57373] text-white" : "bg-[#DCE7CB] text-[#1C1C1C]"}>Situação financeira: {empresa.situacao}</Badge>
                                  {empresa.faixa && <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">Faixa: {empresa.faixa}</Badge>}
                                  {empresa.porte && <Badge variant="outline" className="border-[#1C1C1C] text-[#1C1C1C]">Porte: {empresa.porte}</Badge>}
                                </div>
                              </div>
                            </div>
                            {empresa.tags && empresa.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {empresa.tags.map((tag) => (<span key={tag} className="rounded-full bg-[#EEF4E0] px-3 py-1 text-xs font-medium text-[#4F5B3A]">{tag}</span>))}
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4 text-sm flex-1">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">WhatsApp de contato</p>
                              <div className="flex flex-wrap items-center gap-3 justify-between">
                                <span className="text-base font-semibold text-[#1C1C1C]">{formatWhatsappDisplay(empresa.whatsapp)}</span>
                                {whatsappLink ? (
                                  <Button variant="outline" className="border-[#7E8C5E] text-[#1C1C1C]" asChild aria-label={`Abrir WhatsApp de ${empresa.nome}`}>
                                    <a href={whatsappLink} target="_blank" rel="noreferrer">Abrir WhatsApp</a>
                                  </Button>
                                ) : (
                                  <Button variant="outline" className="border-[#E1E8D3] text-muted-foreground" disabled aria-label={`Abrir WhatsApp de ${empresa.nome}`}>Abrir WhatsApp</Button>
                                )}
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Próximo boleto / pendências</p>
                                <div className="flex items-start gap-2">
                                  <AlertCircle className={`h-4 w-4 ${boletoCritico ? "text-[#E57373]" : "text-[#7E8C5E]"}`} />
                                  <div>
                                    <p className="font-medium">{empresa.proximoBoleto.descricao}</p>
                                    <p className={boletoCritico ? "text-[#E57373]" : "text-muted-foreground"}>{empresa.proximoBoleto.status} • {formatDate(empresa.proximoBoleto.data)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Responsável</p>
                                <p className="font-medium">{responsavel?.nome ?? "—"}</p>
                                <p className="text-muted-foreground">{responsavel?.whatsapp ? `WhatsApp: ${formatWhatsappDisplay(responsavel.whatsapp)}` : "Sem WhatsApp"}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-[#1C1C1C]">
                              {empresa.aniversarioResponsavel && <p>Aniversário do responsável: {formatDate(empresa.aniversarioResponsavel)}</p>}
                              {empresa.aniversarioEmpresa && <p>Aniversário da empresa: {formatDate(empresa.aniversarioEmpresa)}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                              <Button variant="outline" className="border-[#7E8C5E] text-[#1C1C1C]" onClick={() => openDetailModal(empresa)} aria-label={`Ver detalhes de ${empresa.nome}`}>Ver detalhes</Button>
                              <Button variant="secondary" className="bg-[#F7F8F4] text-[#1C1C1C] border border-[#E1E8D3]" onClick={() => openNotesModal(empresa)} aria-label={`Observações de ${empresa.nome}`}>Observações</Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>

                <p className="text-sm text-muted-foreground text-center">CRM atualizado com alertas inteligentes e lista priorizada.</p>
              </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={!!selectedCompany} onOpenChange={(open) => { if (!open) closeDetailModal(); }}>
              <DialogContent aria-label="Detalhes da empresa" className="max-w-xl">
                {selectedCompany && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedCompany.nome}</DialogTitle>
                      <DialogDescription>Resumo rápido do relacionamento e da situação atual.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={selectedCompany.situacao === "Inadimplente" ? "bg-[#E57373] text-white" : "bg-[#DCE7CB] text-[#1C1C1C]"}>Situação financeira: {selectedCompany.situacao}</Badge>
                        {selectedCompany.faixa && <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">Faixa: {selectedCompany.faixa}</Badge>}
                        {selectedCompany.porte && <Badge variant="outline" className="border-[#1C1C1C] text-[#1C1C1C]">Porte: {selectedCompany.porte}</Badge>}
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Situação financeira atual</p>
                        <p className="text-lg font-semibold text-[#1C1C1C]">{selectedCompany.situacao}</p>
                      </div>
                      {selectedCompany.historico && (
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">Histórico rápido</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {selectedCompany.historico.map((item) => (<li key={item}>{item}</li>))}
                          </ul>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-[#E1E8D3] p-3">
                          <p className="text-xs uppercase text-muted-foreground">Aniversário da empresa</p>
                          <p className="text-base font-semibold text-[#1C1C1C]">{formatDate(selectedCompany.aniversarioEmpresa)}</p>
                        </div>
                        <div className="rounded-lg border border-[#E1E8D3] p-3">
                          <p className="text-xs uppercase text-muted-foreground">Aniversário do responsável</p>
                          <p className="text-base font-semibold text-[#1C1C1C]">{formatDate(selectedCompany.aniversarioResponsavel)}</p>
                        </div>
                      </div>
                      {selectedCompany.tags && selectedCompany.tags.length > 0 && (
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">Tags atuais</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCompany.tags.map((tag) => (<span key={tag} className="rounded-full bg-[#EEF4E0] px-3 py-1 text-xs font-medium text-[#4F5B3A]">{tag}</span>))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={closeDetailModal} aria-label="Fechar detalhes">Fechar</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={!!notesCompany} onOpenChange={(open) => { if (!open) closeNotesModal(); }}>
              <DialogContent aria-label="Observações da empresa" className="max-w-lg">
                {notesCompany && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Observações — {notesCompany.nome}</DialogTitle>
                      <DialogDescription>Notas rápidas para lembrar ações importantes desta empresa.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes-textarea">Observações</Label>
                      <Textarea id="observacoes-textarea" placeholder="Digite algo importante para lembrar sobre esta empresa…" value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} rows={5} />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                      <Button variant="outline" onClick={closeNotesModal} aria-label="Cancelar observações">Cancelar</Button>
                      <Button onClick={handleSaveNotes} aria-label="Salvar observações">Salvar</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
