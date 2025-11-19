import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Cake, Flame, PhoneOff, Settings2, Building2 } from "lucide-react";
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
    proximoBoleto: {
      data: "2025-04-10",
      status: "Em atraso",
      descricao: "Boleto março/25"
    },
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
    proximoBoleto: {
      data: "2025-04-28",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
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
    proximoBoleto: {
      data: "2025-04-18",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
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
    proximoBoleto: {
      data: "2025-04-05",
      status: "Em atraso",
      descricao: "Mensalidade fevereiro/25"
    },
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
    proximoBoleto: {
      data: "2025-04-30",
      status: "A vencer",
      descricao: "Mensalidade abril/25"
    },
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

const formatWhatsappDisplay = (value?: string) => {
  if (!value) return "Sem WhatsApp";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) {
    return value;
  }
  const sanitized = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = sanitized.slice(0, 2);
  const numberPart = sanitized.slice(2);
  if (numberPart.length === 9) {
    return `(${ddd}) ${numberPart.slice(0, 5)}-${numberPart.slice(5)}`;
  }
  if (numberPart.length === 8) {
    return `(${ddd}) ${numberPart.slice(0, 4)}-${numberPart.slice(4)}`;
  }
  return `+${digits}`;
};

const getWhatsappLink = (value?: string) => {
  if (!value) return undefined;
  return `https://wa.me/${value}`;
};

const CRM = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [associacaoFilter, setAssociacaoFilter] = useState<string | undefined>();
  const [porteFilter, setPorteFilter] = useState<string | undefined>();
  const [faixaFilter, setFaixaFilter] = useState<string | undefined>();
  const [selectedCompany, setSelectedCompany] = useState<(typeof empresas)[number] | null>(null);
  const [notesCompany, setNotesCompany] = useState<(typeof empresas)[number] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    empresas.forEach((empresa) => {
      initial[empresa.id] = empresa.observacaoPadrao ?? "";
    });
    return initial;
  });
  const [notesDraft, setNotesDraft] = useState("");
  const openDetailModal = (empresa: (typeof empresas)[number]) => setSelectedCompany(empresa);
  const closeDetailModal = () => setSelectedCompany(null);
  const openNotesModal = (empresa: (typeof empresas)[number]) => {
    setNotesCompany(empresa);
    setNotesDraft(notes[empresa.id] ?? "");
  };
  const closeNotesModal = () => {
    setNotesCompany(null);
    setNotesDraft("");
  };
  const handleSaveNotes = () => {
    if (!notesCompany) return;
    setNotes((prev) => ({ ...prev, [notesCompany.id]: notesDraft }));
    closeNotesModal();
  };

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
    return getMonthCalendar(crmHighlights.aniversariosMes);
  }, []);

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
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cake className="h-4 w-4 text-[#7E8C5E]" />
                      Aniversariantes do mês
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Aniversários de empresas e responsáveis (mês atual).
                    </p>
                  </div>
                  {aniversariosHoje.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aniversariosHoje.map((evento) => (
                        <Badge key={`${evento.nome}-${evento.data}`} className="bg-[#DCE7CB] text-[#1C1C1C]">
                          🎉 Hoje: {evento.nome}
                          {evento.empresa && ` / ${evento.empresa}`}
                        </Badge>
                      ))}
                    </div>
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
                      Próximos aniversários
                    </p>
                    {crmHighlights.aniversariosMes.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem aniversários para este mês.</p>
                    )}
                    {crmHighlights.aniversariosMes.map((evento) => (
                      <div
                        key={`${evento.nome}-${evento.data}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-medium text-[#1C1C1C]">{evento.nome}</span>
                          <p className="text-xs text-muted-foreground">
                            {evento.tipo === "responsavel" ? "Responsável" : "Empresa"}
                            {evento.empresa ? ` • ${evento.empresa}` : ""}
                          </p>
                        </div>
                        <span className="font-semibold text-[#7E8C5E]">{formatDate(evento.data)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Informações combinadas para empresas e responsáveis sem necessidade de cadastros extras.
                  </p>
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
                  <div className="flex items-center justify-between rounded-lg border border-[#F5C1C1] bg-[#FDECEC] p-4">
                    <div>
                      <p className="text-base font-semibold text-[#1C1C1C]">Casos &gt; 60 dias</p>
                      <p className="text-xs text-[#8A3A3A]">
                        Ação imediata sugerida pela régua financeira.
                      </p>
                    </div>
                    <Badge className="bg-[#E57373] text-white text-lg px-4 py-2">{inadimplentesCriticos}</Badge>
                  </div>
                  <Button
                    variant="link"
                    className="px-0 text-[#7E8C5E]"
                    asChild
                    aria-label="Ver detalhes no Financeiro"
                  >
                    <a href="/financeiro" className="font-semibold">
                      Ver detalhes no Financeiro
                    </a>
                  </Button>
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
                            <AvatarFallback className="bg-[#DCE7CB] text-[#1C1C1C] font-semibold">
                              {empresa.nome
                                .split(" ")
                                .slice(0, 2)
                                .map((parte) => parte[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
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
                              {empresa.faixa && (
                                <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">
                                  Faixa: {empresa.faixa}
                                </Badge>
                              )}
                              {empresa.porte && (
                                <Badge variant="outline" className="border-[#1C1C1C] text-[#1C1C1C]">
                                  Porte: {empresa.porte}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {empresa.tags && empresa.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {empresa.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#EEF4E0] px-3 py-1 text-xs font-medium text-[#4F5B3A]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 text-sm flex-1">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">WhatsApp de contato</p>
                          <div className="flex flex-wrap items-center gap-3 justify-between">
                            <span className="text-base font-semibold text-[#1C1C1C]">
                              {formatWhatsappDisplay(empresa.whatsapp)}
                            </span>
                            {whatsappLink ? (
                              <Button
                                variant="outline"
                                className="border-[#7E8C5E] text-[#1C1C1C]"
                                asChild
                                aria-label={`Abrir WhatsApp de ${empresa.nome}`}
                              >
                                <a href={whatsappLink} target="_blank" rel="noreferrer">
                                  Abrir WhatsApp
                                </a>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="border-[#E1E8D3] text-muted-foreground"
                                disabled
                                aria-label={`Abrir WhatsApp de ${empresa.nome}`}
                              >
                                Abrir WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Próximo boleto / pendências</p>
                            <div className="flex items-start gap-2">
                              <AlertCircle
                                className={`h-4 w-4 ${boletoCritico ? "text-[#E57373]" : "text-[#7E8C5E]"}`}
                              />
                              <div>
                                <p className="font-medium">{empresa.proximoBoleto.descricao}</p>
                                <p className={boletoCritico ? "text-[#E57373]" : "text-muted-foreground"}>
                                  {empresa.proximoBoleto.status} • {formatDate(empresa.proximoBoleto.data)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Responsável</p>
                            <p className="font-medium">{responsavel?.nome ?? "—"}</p>
                            <p className="text-muted-foreground">
                              {responsavel?.whatsapp
                                ? `WhatsApp: ${formatWhatsappDisplay(responsavel.whatsapp)}`
                                : "Sem WhatsApp"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-[#1C1C1C]">
                          {empresa.aniversarioResponsavel && (
                            <p>Aniversário do responsável: {formatDate(empresa.aniversarioResponsavel)}</p>
                          )}
                          {empresa.aniversarioEmpresa && (
                            <p>Aniversário da empresa: {formatDate(empresa.aniversarioEmpresa)}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                          <Button
                            variant="outline"
                            className="border-[#7E8C5E] text-[#1C1C1C]"
                            onClick={() => openDetailModal(empresa)}
                            aria-label={`Ver detalhes de ${empresa.nome}`}
                          >
                            Ver detalhes
                          </Button>
                          <Button
                            variant="secondary"
                            className="bg-[#F7F8F4] text-[#1C1C1C] border border-[#E1E8D3]"
                            onClick={() => openNotesModal(empresa)}
                            aria-label={`Observações de ${empresa.nome}`}
                          >
                            Observações
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

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
                        <Badge
                          className={
                            selectedCompany.situacao === "Inadimplente"
                              ? "bg-[#E57373] text-white"
                              : "bg-[#DCE7CB] text-[#1C1C1C]"
                          }
                        >
                          Situação financeira: {selectedCompany.situacao}
                        </Badge>
                        {selectedCompany.faixa && (
                          <Badge variant="outline" className="border-[#7E8C5E] text-[#7E8C5E]">
                            Faixa: {selectedCompany.faixa}
                          </Badge>
                        )}
                        {selectedCompany.porte && (
                          <Badge variant="outline" className="border-[#1C1C1C] text-[#1C1C1C]">
                            Porte: {selectedCompany.porte}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Situação financeira atual</p>
                        <p className="text-lg font-semibold text-[#1C1C1C]">{selectedCompany.situacao}</p>
                      </div>
                      {selectedCompany.historico && (
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">Histórico rápido</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {selectedCompany.historico.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-[#E1E8D3] p-3">
                          <p className="text-xs uppercase text-muted-foreground">Aniversário da empresa</p>
                          <p className="text-base font-semibold text-[#1C1C1C]">
                            {formatDate(selectedCompany.aniversarioEmpresa)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#E1E8D3] p-3">
                          <p className="text-xs uppercase text-muted-foreground">Aniversário do responsável</p>
                          <p className="text-base font-semibold text-[#1C1C1C]">
                            {formatDate(selectedCompany.aniversarioResponsavel)}
                          </p>
                        </div>
                      </div>
                      {selectedCompany.tags && selectedCompany.tags.length > 0 && (
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">Tags atuais</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCompany.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#EEF4E0] px-3 py-1 text-xs font-medium text-[#4F5B3A]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={closeDetailModal} aria-label="Fechar detalhes">
                        Fechar
                      </Button>
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
                      <DialogDescription>
                        Notas rápidas para lembrar ações importantes desta empresa.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes-textarea">Observações</Label>
                      <Textarea
                        id="observacoes-textarea"
                        placeholder="Digite algo importante para lembrar sobre esta empresa…"
                        value={notesDraft}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        rows={5}
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                      <Button
                        variant="outline"
                        onClick={closeNotesModal}
                        aria-label="Cancelar observações"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveNotes} aria-label="Salvar observações">
                        Salvar
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

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
