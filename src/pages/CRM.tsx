import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Cake, Calendar, Flame, PhoneOff, Settings2, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const crmHighlights = {
  aniversarios: [
    { nome: "Estilo Nordeste", data: "2025-04-15", tipo: "empresa" },
    { nome: "Bruno Lima", empresa: "Moda Sul", data: "2025-04-22", tipo: "responsavel" },
    { nome: "Juliana Costa", empresa: "Costura Viva", data: "2025-04-03", tipo: "responsavel" }
  ],
  fundacoes: [
    { empresa: "Confecções Aurora", anos: 12, data: "2025-04-22" },
    { empresa: "Trama Nobre", anos: 5, data: "2025-05-02" }
  ],
  inadimplentesRecentes: 7
};

const empresas = [
  {
    id: 1,
    nome: "Estilo Nordeste",
    logo: "",
    situacao: "Inadimplente",
    engajamento: 42,
    beneficios: ["Parceria Unifor", "Convênio Sebrae"],
    beneficiosNaoUtilizados: ["Mentoria ESG"],
    proximoAniversario: "2025-04-15",
    proximoBoleto: {
      data: "2025-04-10",
      status: "Em atraso",
      descricao: "Boleto março/25"
    },
    responsavel: { nome: "Lúcia Costa", whatsapp: "" },
    colaboradores: [{ nome: "Marcelo Dias", whatsapp: "55999887766" }],
    faixa: "Premium",
    porte: "Médio",
    associada: true,
    multiplosAtrasos: 3,
    diasInadimplente: 70,
    capitalSocial: 500000,
    dataFundacao: "2013-04-15"
  },
  {
    id: 2,
    nome: "Costura Viva",
    logo: "",
    situacao: "Regular",
    engajamento: 58,
    beneficios: ["Curso Moda Sustentável"],
    beneficiosNaoUtilizados: [],
    proximoAniversario: "2025-04-03",
    proximoBoleto: {
      data: "2025-04-28",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
    responsavel: { nome: "Ana Pires", whatsapp: "" },
    colaboradores: [],
    faixa: "Essencial",
    porte: "Pequeno",
    associada: true,
    multiplosAtrasos: 2,
    diasInadimplente: 0,
    capitalSocial: 150000,
    dataFundacao: "2019-02-10"
  },
  {
    id: 3,
    nome: "Confecções Aurora",
    logo: "",
    situacao: "Regular",
    engajamento: 91,
    beneficios: ["Convênio Sebrae", "Desconto em Insumos", "Mentoria Comercial"],
    beneficiosNaoUtilizados: ["Programa de Exportação"],
    proximoAniversario: "2025-06-18",
    proximoBoleto: {
      data: "2025-04-18",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
    responsavel: { nome: "Renato Souza", whatsapp: "558899772211" },
    colaboradores: [{ nome: "Paula Sanches", whatsapp: "558899221177" }],
    faixa: "Premium",
    porte: "Grande",
    associada: true,
    multiplosAtrasos: 0,
    diasInadimplente: 0,
    capitalSocial: 1200000,
    dataFundacao: "2012-04-22"
  },
  {
    id: 4,
    nome: "Moda Sul",
    logo: "",
    situacao: "Inadimplente",
    engajamento: 47,
    beneficios: ["Programa de Mentoria", "Convênio SindRoupas"],
    beneficiosNaoUtilizados: ["Hub de Inovação"],
    proximoAniversario: "2025-04-22",
    proximoBoleto: {
      data: "2025-04-05",
      status: "Em atraso",
      descricao: "Mensalidade fevereiro/25"
    },
    responsavel: { nome: "Bruno Lima", whatsapp: "" },
    colaboradores: [{ nome: "Sara Nunes", whatsapp: "55988123000" }],
    faixa: "Essencial",
    porte: "Médio",
    associada: false,
    multiplosAtrasos: 1,
    diasInadimplente: 35,
    capitalSocial: 230000,
    dataFundacao: "2015-04-22"
  },
  {
    id: 5,
    nome: "Trama Nobre",
    logo: "",
    situacao: "Regular",
    engajamento: 76,
    beneficios: ["Convênio SindRoupas"],
    beneficiosNaoUtilizados: [],
    proximoAniversario: "2025-05-02",
    proximoBoleto: {
      data: "2025-04-30",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
    responsavel: null,
    colaboradores: [{ nome: "Felipe Duarte", whatsapp: "" }],
    faixa: "Expansão",
    porte: "Pequeno",
    associada: false,
    multiplosAtrasos: 0,
    diasInadimplente: 0,
    capitalSocial: 0,
    dataFundacao: ""
  }
];

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
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
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

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  return { cells, highlightedDays };
};

const getResponsavel = (empresa: (typeof empresas)[number]) => {
  if (empresa.responsavel) {
    return empresa.responsavel;
  }
  return empresa.colaboradores[0] ?? null;
};

const CRM = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [associacaoFilter, setAssociacaoFilter] = useState<string | undefined>();
  const [porteFilter, setPorteFilter] = useState<string | undefined>();
  const [faixaFilter, setFaixaFilter] = useState<string | undefined>();

  const empresasSemWhatsapp = useMemo(() => {
    return empresas
      .filter((empresa) => {
        const contato = getResponsavel(empresa);
        return !contato?.whatsapp;
      })
      .map((empresa) => ({
        empresa: empresa.nome,
        responsavel: getResponsavel(empresa)?.nome ?? "—"
      }));
  }, []);

  const dadosIncompletos = useMemo(() => {
    const detalhes = {
      semLogo: empresas.filter((empresa) => !empresa.logo).length,
      semResponsavel: empresas.filter((empresa) => !empresa.responsavel).length,
      semColaboradores: empresas.filter((empresa) => empresa.colaboradores.length === 0).length,
      semCapitalSocial: empresas.filter((empresa) => !empresa.capitalSocial).length,
      semPorte: empresas.filter((empresa) => !empresa.porte).length,
      semFundacao: empresas.filter((empresa) => !empresa.dataFundacao).length,
      semFaixa: empresas.filter((empresa) => !empresa.faixa).length
    };

    const total = empresas.filter(
      (empresa) =>
        !empresa.logo ||
        !empresa.responsavel ||
        empresa.colaboradores.length === 0 ||
        !empresa.capitalSocial ||
        !empresa.porte ||
        !empresa.dataFundacao ||
        !empresa.faixa
    ).length;

    return { total, detalhes };
  }, []);

  const companiesWithMultipleDelays = useMemo(() => {
    return empresas
      .filter((empresa) => (empresa.multiplosAtrasos ?? 0) >= 2)
      .map((empresa) => ({ empresa: empresa.nome, atrasos: empresa.multiplosAtrasos }));
  }, []);

  const inadimplentesCriticos = useMemo(() => {
    return empresas.filter((empresa) => empresa.diasInadimplente > 60).length;
  }, []);

  const { cells: calendarCells, highlightedDays } = useMemo(() => {
    return getMonthCalendar(crmHighlights.aniversarios);
  }, []);

  const proximosAniversariosSemana = useMemo(() => {
    return crmHighlights.aniversarios
      .filter((evento) => isWithinNextDays(evento.data, 7))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, []);

  const aniversariosHoje = proximosAniversariosSemana.filter((evento) => {
    const hoje = startOfDay(getToday());
    const dataEvento = startOfDay(new Date(evento.data));
    return hoje.getTime() === dataEvento.getTime();
  });

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId) ? prev.filter((item) => item !== filterId) : [...prev, filterId]
    );
  };

  const filteredCompanies = useMemo(() => {
    return empresas.filter((empresa) => {
      if (activeFilters.includes("aniversariantesMes")) {
        const aniversario = empresa.proximoAniversario ? new Date(empresa.proximoAniversario) : null;
        if (!aniversario || aniversario.getMonth() !== getToday().getMonth()) {
          return false;
        }
      }

      if (activeFilters.includes("inadimplentes") && empresa.situacao !== "Inadimplente") {
        return false;
      }

      if (activeFilters.includes("multiplosAtrasos") && (empresa.multiplosAtrasos ?? 0) < 2) {
        return false;
      }

      if (
        activeFilters.includes("responsavelSemWhatsapp") &&
        getResponsavel(empresa)?.whatsapp
      ) {
        return false;
      }

      if (
        activeFilters.includes("beneficiosNaoUtilizados") &&
        !(empresa.beneficiosNaoUtilizados && empresa.beneficiosNaoUtilizados.length > 0)
      ) {
        return false;
      }

      if (activeFilters.includes("engajamentoBaixo") && empresa.engajamento >= 50) {
        return false;
      }

      if (
        associacaoFilter &&
        ((associacaoFilter === "Sim" && !empresa.associada) ||
          (associacaoFilter === "Não" && empresa.associada))
      ) {
        return false;
      }

      if (porteFilter && empresa.porte !== porteFilter) {
        return false;
      }

      if (faixaFilter && empresa.faixa !== faixaFilter) {
        return false;
      }

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

  const sortedCompanies = useMemo(() => {
    return [...filteredCompanies].sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
  }, [filteredCompanies]);

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
      <div className="min-h-screen flex w-full bg-[#F7F8F4] text-[#1C1C1C]">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[#7E8C5E]">
                Central Inteligente de Avisos & Prioridades
              </p>
              <h1 className="text-3xl font-bold">CRM - Relacionamento</h1>
              <p className="text-muted-foreground max-w-3xl">
                Monitoramento automático da saúde das empresas com alertas inteligentes, filtros
                contextuais e uma lista priorizada para atuação rápida da equipe SindRoupas.
              </p>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
              {/* Card 1 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cake className="h-4 w-4 text-[#7E8C5E]" />
                      Aniversariantes do mês
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Destaque automático para empresas, responsáveis e colaboradores.
                    </p>
                  </div>
                  {aniversariosHoje.length > 0 && (
                    <Badge className="bg-[#DCE7CB] text-[#1C1C1C]">
                      🎉 Hoje: {aniversariosHoje[0].nome}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((dia) => (
                        <span key={dia}>{dia}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-sm">
                      {calendarCells.map((cell, index) => {
                        if (cell === null) {
                          return <div key={`empty-${index}`} className="h-8" />;
                        }
                        const isHighlighted = highlightedDays.includes(cell);
                        return (
                          <div
                            key={cell}
                            className={`h-8 flex items-center justify-center rounded-md border text-xs ${
                              isHighlighted
                                ? "border-[#7E8C5E] bg-[#DCE7CB] text-[#1C1C1C] font-semibold"
                                : "border-transparent text-muted-foreground"
                            }`}
                          >
                            {cell}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Próximos 7 dias
                    </p>
                    {proximosAniversariosSemana.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem aniversários próximos.</p>
                    )}
                    {proximosAniversariosSemana.map((evento) => (
                      <div
                        key={`${evento.nome}-${evento.data}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {evento.nome}
                          {evento.empresa && <span className="text-muted-foreground"> — {evento.empresa}</span>}
                        </span>
                        <span className="font-medium text-[#7E8C5E]">{formatDate(evento.data)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#7E8C5E]" />
                    Aniversários de Fundação
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Empresas que completam novo ciclo nos próximos 30 dias.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {crmHighlights.fundacoes.map((fundacao) => (
                    <div key={fundacao.empresa} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{fundacao.empresa}</p>
                        <p className="text-muted-foreground">{fundacao.anos} anos em {formatDate(fundacao.data)}</p>
                      </div>
                      <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">
                        Preparar ação
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver lista completa de fundações">
                    Ver lista completa
                  </Button>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#E57373]" />
                    Inadimplentes recentes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Monitoramento dos últimos 30 dias com foco nos casos críticos.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-4xl font-bold">{crmHighlights.inadimplentesRecentes}</p>
                    <p className="text-sm text-muted-foreground">entraram em inadimplência</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#FDECEC] p-3">
                    <div>
                      <p className="text-sm font-medium">Casos &gt; 60 dias</p>
                      <p className="text-xs text-muted-foreground">
                        Ação imediata sugerida pela régua financeira.
                      </p>
                    </div>
                    <Badge className="bg-[#E57373] text-white">{inadimplentesCriticos}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#E57373]" />
                    Múltiplos atrasos (alto risco)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Empresas com 2+ boletos atrasados agrupadas automaticamente.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {companiesWithMultipleDelays.slice(0, 2).map((empresa) => (
                    <div key={empresa.empresa} className="flex items-center justify-between text-sm">
                      <span>{empresa.empresa}</span>
                      <Badge variant="destructive" className="bg-[#E57373] hover:bg-[#d96262]">
                        {empresa.atrasos} atrasos
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver detalhes de múltiplos atrasos">
                    Ver detalhes
                  </Button>
                </CardContent>
              </Card>

              {/* Card 5 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PhoneOff className="h-4 w-4 text-[#7E8C5E]" />
                    Responsáveis sem WhatsApp
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Checagem automática considerando o primeiro colaborador como fallback.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold">{empresasSemWhatsapp.length}</p>
                    <p className="text-sm text-muted-foreground">empresas</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {empresasSemWhatsapp.map((item) => item.empresa).join(", ") || "Todas com WhatsApp"}
                  </div>
                </CardContent>
              </Card>

              {/* Card 6 */}
              <Card className="border-[#E1E8D3] shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-[#7E8C5E]" />
                    Dados incompletos
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Checklist automático para garantir cadastros completos.
                  </p>
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
                  <Button variant="outline" className="w-full border-[#E1E8D3]" aria-label="Ver pendências de dados">
                    Ver pendências
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-semibold">Lista de empresas priorizada</h2>
                <span className="text-sm text-muted-foreground">Ordenação automática conforme risco e oportunidade</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                    className={
                      activeFilters.includes(filter.id)
                        ? "bg-[#7E8C5E] text-white border-[#7E8C5E]"
                        : "border-[#E1E8D3] text-[#1C1C1C]"
                    }
                    onClick={() => toggleFilter(filter.id)}
                    aria-pressed={activeFilters.includes(filter.id)}
                    aria-label={`Filtro ${filter.label}`}
                  >
                    {filter.label}
                  </Button>
                ))}
                <Select
                  value={associacaoFilter}
                  onValueChange={(value) => setAssociacaoFilter(value === "todas" ? undefined : value)}
                >
                  <SelectTrigger className="w-[160px] border-[#E1E8D3] bg-white">
                    <SelectValue placeholder="Associação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Sim">Associadas</SelectItem>
                    <SelectItem value="Não">Não associadas</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={porteFilter}
                  onValueChange={(value) => setPorteFilter(value === "todos" ? undefined : value)}
                >
                  <SelectTrigger className="w-[140px] border-[#E1E8D3] bg-white">
                    <SelectValue placeholder="Porte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Pequeno">Pequeno</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={faixaFilter}
                  onValueChange={(value) => setFaixaFilter(value === "todas" ? undefined : value)}
                >
                  <SelectTrigger className="w-[140px] border-[#E1E8D3] bg-white">
                    <SelectValue placeholder="Faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Essencial">Essencial</SelectItem>
                    <SelectItem value="Expansão">Expansão</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-4">
              {sortedCompanies.map((empresa) => {
                const responsavel = getResponsavel(empresa);
                const isInadimplente = empresa.situacao === "Inadimplente";
                const boletoCritico = empresa.proximoBoleto.status === "Em atraso";
                return (
                  <Card key={empresa.id} className="border-[#E1E8D3] shadow-sm bg-white">
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border border-[#E1E8D3]">
                          <AvatarImage src={empresa.logo} alt={empresa.nome} />
                          <AvatarFallback className="bg-[#DCE7CB] text-[#1C1C1C] font-semibold">
                            {empresa.nome
                              .split(" ")
                              .slice(0, 2)
                              .map((parte) => parte[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{empresa.nome}</CardTitle>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              className={
                                isInadimplente
                                  ? "bg-[#E57373] text-white"
                                  : "bg-[#DCE7CB] text-[#1C1C1C]"
                              }
                            >
                              Situação financeira: {empresa.situacao}
                            </Badge>
                            <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">
                              Faixa: {empresa.faixa}
                            </Badge>
                            <Badge variant="outline" className="border-[#1C1C1C] text-[#1C1C1C]">
                              Porte: {empresa.porte || "—"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-[#7E8C5E] text-[#1C1C1C]"
                        onClick={() => navigate(`/dashboard/crm/${empresa.id}`)}
                        aria-label={`Ver detalhes de ${empresa.nome}`}
                      >
                        Ver detalhes
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Engajamento</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-semibold">{empresa.engajamento}%</span>
                          </div>
                          <Progress value={empresa.engajamento} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Benefícios ativos</p>
                          <div className="flex flex-wrap gap-2">
                            {empresa.beneficios.map((beneficio) => (
                              <Badge key={beneficio} variant="secondary" className="bg-[#F7F8F4] text-[#1C1C1C]">
                                {beneficio}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 text-sm">
                          <p className="text-muted-foreground">Próximo aniversário</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#7E8C5E]" />
                            <span>{formatDate(empresa.proximoAniversario ?? undefined)}</span>
                          </div>
                          {empresa.beneficiosNaoUtilizados && empresa.beneficiosNaoUtilizados.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Benefícios a ativar: {empresa.beneficiosNaoUtilizados.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-muted-foreground">Próximo boleto / pendências</p>
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`h-4 w-4 ${boletoCritico ? "text-[#E57373]" : "text-[#7E8C5E]"}`} />
                            <div>
                              <p className="font-medium">{empresa.proximoBoleto.descricao}</p>
                              <p className={boletoCritico ? "text-[#E57373]" : "text-muted-foreground"}>
                                {empresa.proximoBoleto.status} • {formatDate(empresa.proximoBoleto.data)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Responsável</p>
                          <p className="font-medium">{responsavel?.nome ?? "—"}</p>
                          <p className="text-muted-foreground">
                            {responsavel?.whatsapp ? `WhatsApp: ${responsavel.whatsapp}` : "Sem WhatsApp"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Associação</p>
                          <p className="font-medium">{empresa.associada ? "Sim" : "Não"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Capital social</p>
                          <p className="font-medium">
                            {empresa.capitalSocial
                              ? empresa.capitalSocial.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                  maximumFractionDigits: 0
                                })
                              : "Não informado"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <p className="text-sm text-muted-foreground text-center">
              CRM atualizado com alertas inteligentes e lista priorizada.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CRM;
