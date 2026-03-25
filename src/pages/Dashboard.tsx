import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ImpersonationBar } from "@/components/ImpersonationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format, isAfter, isBefore, parseISO, startOfMonth, subMonths } from "date-fns";
import { hasuraRequest } from "@/lib/api/hasura";
import { useAuth } from "@/contexts/AuthContext";

import { formatCurrency, getWhatsappLink } from "@/components/dashboard/utils";

// Components
import { NovasKPIs } from "@/components/dashboard/NovasKPIs";
import { PrioridadesOperacional, PrioridadeOperacional } from "@/components/dashboard/PrioridadesOperacional";
import { CalendarioMensal } from "@/components/dashboard/CalendarioMensal";
import { ResumoCarteira } from "@/components/dashboard/ResumoCarteira";
import { EmpresasIncompletas, EmpresaIncompleta } from "@/components/dashboard/EmpresasIncompletas";
import { ParticipacaoEventosCard } from "@/components/dashboard/ParticipacaoEventosCard";

type DashboardEmpresaRow = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  whatsapp?: string | null;
  data_fundacao?: string | null;
  responsaveis?: { id: string; nome?: string | null; whatsapp?: string | null }[];
  colaboradores?: { id: string; nome?: string | null; whatsapp?: string | null }[];
};

type DashboardBoletoRow = {
  id: string;
  empresa_id?: string | null;
  valor?: number | string | null;
  vencimento?: string | null;
  efi_status?: string | null;
};

const DASHBOARD_QUERY = `
  query DashboardPage {
    empresas(order_by: { razao_social: asc }) {
      id
      razao_social
      nome_fantasia
      whatsapp
      data_fundacao
      responsaveis {
        id
        nome
        whatsapp
      }
      colaboradores {
        id
        nome
        whatsapp
      }
    }
    financeiro_boletos(order_by: { vencimento: desc }) {
      id
      empresa_id
      valor
      vencimento
      efi_status
    }
  }
`;

const normalizeStatus = (status?: string | null) => {
  const s = status?.trim().toLowerCase();
  if (!s) return "Aguardando";
  if (["pago", "paid", "liquidado", "recebido"].includes(s)) return "Pago";
  if (["cancelado", "cancelled", "canceled"].includes(s)) return "Cancelado";
  if (["inadimplente", "atrasado", "vencido", "overdue"].includes(s)) return "Inadimplente";
  return "Aguardando";
};

const Dashboard = () => {
  const { token } = useAuth();
  const hoje = new Date();
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState(format(startOfMonth(hoje), "yyyy-MM-dd"));
  const [periodoFim, setPeriodoFim] = useState(format(hoje, "yyyy-MM-dd"));
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaIncompleta | null>(null);
  const [focusField, setFocusField] = useState<string | undefined>();
  const [formData, setFormData] = useState({
    whatsapp: "",
    responsavel: "",
    dataFundacao: "",
    aniversarioResponsavel: "",
  });

  const whatsappInputRef = useRef<HTMLInputElement>(null);
  const responsavelInputRef = useRef<HTMLInputElement>(null);
  const dataFundacaoInputRef = useRef<HTMLInputElement>(null);
  const aniversarioInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["dashboard-page"],
    queryFn: () =>
      hasuraRequest<{ empresas: DashboardEmpresaRow[]; financeiro_boletos: DashboardBoletoRow[] }>({
        query: DASHBOARD_QUERY,
        token,
      }),
  });

  const { empresas, prioridadesOperacionais, dashboardKPIs, carteiraResumo, empresasIncompletas, calendarEvents } = useMemo(() => {
    const today = new Date();
    const rows = data?.empresas ?? [];
    const boletos = data?.financeiro_boletos ?? [];
    const inicioPeriodo = periodoInicio ? parseISO(periodoInicio) : null;
    const fimPeriodo = periodoFim ? parseISO(periodoFim) : null;
    const boletosNoPeriodo = boletos.filter((b) => {
      if (!b.vencimento) return false;
      const vencimento = parseISO(b.vencimento);
      if (inicioPeriodo && isBefore(vencimento, inicioPeriodo)) return false;
      if (fimPeriodo && isAfter(vencimento, fimPeriodo)) return false;
      return true;
    });
    const empresasMapeadas = rows.map((empresa, index) => {
      const id = index + 1;
      const nome = empresa.nome_fantasia?.trim() || empresa.razao_social?.trim() || "Empresa sem nome";
      const boletosEmpresa = boletosNoPeriodo.filter((b) => b.empresa_id === empresa.id);
      const emAberto = boletosEmpresa.filter((b) => normalizeStatus(b.efi_status) !== "Pago" && normalizeStatus(b.efi_status) !== "Cancelado");
      const valorEmAberto = emAberto.reduce((acc, b) => acc + (b.valor ? Number(b.valor) : 0), 0);
      const vencidos = emAberto
        .filter((b) => b.vencimento && isBefore(parseISO(b.vencimento), today))
        .sort((a, b) => parseISO(a.vencimento as string).getTime() - parseISO(b.vencimento as string).getTime());
      const diasInadimplente = vencidos.length ? Math.max(0, differenceInDays(today, parseISO(vencidos[0].vencimento as string))) : 0;
      const proximoBoleto = emAberto
        .filter((b) => b.vencimento)
        .sort((a, b) => parseISO(a.vencimento as string).getTime() - parseISO(b.vencimento as string).getTime())[0];
      const responsavel = empresa.responsaveis?.[0];
      return {
        id,
        idOriginal: empresa.id,
        nome,
        situacao: diasInadimplente > 0 ? "Inadimplente" : "Regular",
        valorEmAberto,
        diasInadimplente,
        historico: [`${emAberto.length} boleto(s) em aberto`],
        whatsapp: empresa.whatsapp || responsavel?.whatsapp || "",
        responsavelNome: responsavel?.nome || "",
        dataFundacao: empresa.data_fundacao || "",
        proximoBoleto: proximoBoleto
          ? {
              data: proximoBoleto.vencimento || "",
              status: normalizeStatus(proximoBoleto.efi_status),
              descricao: `Boleto ${format(parseISO(proximoBoleto.vencimento || new Date().toISOString()), "MM/yyyy")}`,
            }
          : undefined,
      };
    });

    const prioridadeBoletos = empresasMapeadas
      .filter((e) => e.diasInadimplente > 0 || e.valorEmAberto > 0)
      .sort((a, b) => b.diasInadimplente - a.diasInadimplente)
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        tipo: "boleto" as const,
        contexto: `Atraso ${e.diasInadimplente}d • ${formatCurrency(e.valorEmAberto)} em aberto`,
        chips: [
          { label: e.diasInadimplente > 60 ? "Crítico" : "Atenção", tipo: e.diasInadimplente > 60 ? "critico" as const : "atencao" as const },
        ],
      }));

    const prioridadeAniversarios = empresasMapeadas
      .filter((e) => Boolean(e.dataFundacao))
      .map((e) => {
        const base = parseISO(e.dataFundacao);
        const prox = new Date(today.getFullYear(), base.getMonth(), base.getDate());
        if (isBefore(prox, today)) prox.setFullYear(today.getFullYear() + 1);
        return { empresa: e, dias: differenceInDays(prox, today) };
      })
      .filter((item) => item.dias >= 0 && item.dias <= 7)
      .slice(0, 2)
      .map((item) => ({
        id: item.empresa.id,
        nome: item.empresa.nome,
        tipo: "aniversario" as const,
        contexto: `Aniversário de fundação em ${item.dias} dia(s)`,
        chips: [{ label: "Aniversário", tipo: "aniversario" as const }],
      }));

    const prioridadeSemFundacao = empresasMapeadas
      .filter((e) => !e.dataFundacao)
      .slice(0, 2)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        tipo: "aniversario" as const,
        contexto: "Data de fundação não cadastrada",
        chips: [{ label: "Cadastro incompleto", tipo: "atencao" as const }],
      }));

    const prioridades = [...prioridadeBoletos, ...prioridadeAniversarios, ...prioridadeSemFundacao];

    const boletosVencidos = boletosNoPeriodo.filter((b) => b.vencimento && isBefore(parseISO(b.vencimento), today) && normalizeStatus(b.efi_status) !== "Pago");
    const empresasInadimplentesCount = empresasMapeadas.filter((e) => e.situacao === "Inadimplente").length;
    const currentMonth = startOfMonth(today);
    const prevMonth = startOfMonth(subMonths(today, 1));
    const faturadoMes = boletosNoPeriodo.reduce((acc, b) => {
      if (normalizeStatus(b.efi_status) !== "Pago" || !b.vencimento) return acc;
      const d = parseISO(b.vencimento);
      return d >= currentMonth ? acc + Number(b.valor || 0) : acc;
    }, 0);
    const faturadoMesAnterior = boletosNoPeriodo.reduce((acc, b) => {
      if (normalizeStatus(b.efi_status) !== "Pago" || !b.vencimento) return acc;
      const d = parseISO(b.vencimento);
      return d >= prevMonth && d < currentMonth ? acc + Number(b.valor || 0) : acc;
    }, 0);

    const kpis = {
      inadimplencia: rows.length ? (empresasInadimplentesCount / rows.length) * 100 : 0,
      inadimplenciaVariacao: 0,
      totalFaturadoMes: faturadoMes,
      totalFaturadoVariacao: faturadoMesAnterior ? ((faturadoMes - faturadoMesAnterior) / faturadoMesAnterior) * 100 : 0,
      valorEmAtraso: boletosVencidos.reduce((acc, b) => acc + Number(b.valor || 0), 0),
      qtdBoletosVencidos: boletosVencidos.length,
      empresasCriticas: empresasMapeadas.filter((e) => e.diasInadimplente > 60).length,
      proximosVencimentos15d: boletosNoPeriodo.filter((b) => {
        if (!b.vencimento || normalizeStatus(b.efi_status) === "Pago") return false;
        const d = parseISO(b.vencimento);
        return isAfter(d, today) && differenceInDays(d, today) <= 15;
      }).length,
    };

    const incompletas: EmpresaIncompleta[] = empresasMapeadas
      .map((e) => {
        const missingFields: string[] = [];
        if (!e.whatsapp) missingFields.push("whatsapp");
        if (!e.responsavelNome) missingFields.push("responsavel");
        if (!e.dataFundacao) missingFields.push("dataFundacao");
        return { id: e.id, nome: e.nome, missingFields };
      })
      .filter((e) => e.missingFields.length > 0);

    const events = [
      ...boletosNoPeriodo
        .filter((b) => b.vencimento)
        .slice(0, 20)
        .map((b) => ({
          date: b.vencimento as string,
          type: isBefore(parseISO(b.vencimento as string), today) ? ("atrasado" as const) : ("vencimento" as const),
          label: isBefore(parseISO(b.vencimento as string), today) ? "Atrasado" : "Vencimento",
          detail: `Boleto ${formatCurrency(Number(b.valor || 0))}`,
        })),
    ];

    return {
      empresas: empresasMapeadas,
      prioridadesOperacionais: prioridades,
      dashboardKPIs: kpis,
      carteiraResumo: {
        boletosEmAtraso: boletosVencidos.length,
        empresasInadimplentes: empresasInadimplentesCount,
        empresasEmDia: Math.max(0, rows.length - empresasInadimplentesCount),
      },
      empresasIncompletas: incompletas,
      calendarEvents: events,
    };
  }, [data, periodoFim, periodoInicio]);

  // Auto-focus on the missing field when modal opens
  useEffect(() => {
    if (editingEmpresa && focusField) {
      setTimeout(() => {
        const refs: Record<string, React.RefObject<HTMLInputElement>> = {
          whatsapp: whatsappInputRef,
          responsavel: responsavelInputRef,
          dataFundacao: dataFundacaoInputRef,
          aniversarioResponsavel: aniversarioInputRef,
        };
        refs[focusField]?.current?.focus();
      }, 100);
    }
  }, [editingEmpresa, focusField]);

  // Filtered priorities based on search
  const prioridadesFiltradas = useMemo(() => {
    if (!searchQuery) return prioridadesOperacionais;
    const query = searchQuery.toLowerCase();
    return prioridadesOperacionais.filter(
      (p) =>
        p.nome.toLowerCase().includes(query) ||
        p.contexto.toLowerCase().includes(query)
    );
  }, [prioridadesOperacionais, searchQuery]);

  // Find empresa for details modal
  const selectedEmpresa = useMemo(() => {
    if (!selectedEmpresaId) return null;
    return empresas.find((e) => e.id === selectedEmpresaId) || null;
  }, [selectedEmpresaId]);

  const handleCorrigirCadastro = (empresa: EmpresaIncompleta, field?: string) => {
    setEditingEmpresa(empresa);
    setFocusField(field);
    setFormData({
      whatsapp: "",
      responsavel: "",
      dataFundacao: "",
      aniversarioResponsavel: "",
    });
  };

  const handleSaveForm = () => {
    toast.success(`Dados de ${editingEmpresa?.nome} atualizados com sucesso!`);
    setEditingEmpresa(null);
    setFocusField(undefined);
  };

  const handleAcaoPrimaria = (prioridade: PrioridadeOperacional) => {
    if (prioridade.tipo === "boleto") {
      toast.info(`Cobrança enviada para ${prioridade.nome}`);
    } else {
      toast.success(`Mensagem de aniversário pronta para ${prioridade.nome}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <ImpersonationBar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto w-full">
              
              {/* Header */}
              <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                    Painel do Sindicato
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhamento diário de adimplência e relacionamento
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Buscar empresa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-card border-border text-sm"
                      aria-label="Buscar empresa ou responsável"
                    />
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
                    <Input
                      type="date"
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                      className="h-8 w-full sm:w-auto"
                      aria-label="Data inicial do período do dashboard"
                    />
                    <Input
                      type="date"
                      value={periodoFim}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                      className="h-8 w-full sm:w-auto"
                      aria-label="Data final do período do dashboard"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setPeriodoInicio("");
                        setPeriodoFim("");
                      }}
                    >
                      Limpar período
                    </Button>
                  </div>
                </div>
              </header>

            {/* B) KPIs - Nova versão */}
            <NovasKPIs
              inadimplencia={dashboardKPIs.inadimplencia}
              inadimplenciaVariacao={dashboardKPIs.inadimplenciaVariacao}
              totalFaturadoMes={dashboardKPIs.totalFaturadoMes}
              totalFaturadoVariacao={dashboardKPIs.totalFaturadoVariacao}
              valorEmAtraso={dashboardKPIs.valorEmAtraso}
              qtdBoletosVencidos={dashboardKPIs.qtdBoletosVencidos}
              empresasCriticas={dashboardKPIs.empresasCriticas}
              proximosVencimentos={dashboardKPIs.proximosVencimentos15d}
            />

            {/* KPI extra: Participação em eventos */}
            <ParticipacaoEventosCard month={new Date().getMonth()} year={new Date().getFullYear()} />

            {/* C) Split: Prioridades (left) + Calendário (right) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PrioridadesOperacional
                prioridades={prioridadesFiltradas}
                onVerDetalhes={(id) => setSelectedEmpresaId(id)}
                onAcaoPrimaria={handleAcaoPrimaria}
              />
              <CalendarioMensal events={calendarEvents} />
            </div>

            {/* D) Resumo da Carteira + E) Empresas Incompletas */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ResumoCarteira
                boletosEmAtraso={carteiraResumo.boletosEmAtraso}
                empresasInadimplentes={carteiraResumo.empresasInadimplentes}
                empresasEmDia={carteiraResumo.empresasEmDia}
              />
              <EmpresasIncompletas
                empresas={empresasIncompletas}
                onCorrigir={handleCorrigirCadastro}
              />
            </div>

            {/* Dialog Detalhes */}
            <Dialog open={!!selectedEmpresa} onOpenChange={(open) => !open && setSelectedEmpresaId(null)}>
              <DialogContent className="max-w-lg" role="dialog" aria-labelledby="detalhes-titulo">
                {selectedEmpresa && (
                  <>
                    <DialogHeader>
                      <DialogTitle id="detalhes-titulo" className="flex items-center gap-2">
                        {selectedEmpresa.nome}
                        <Badge className={selectedEmpresa.situacao === "Inadimplente" ? "bg-destructive" : "bg-accent"}>
                          {selectedEmpresa.situacao}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {selectedEmpresa.proximoBoleto?.descricao || "Resumo da empresa"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Valor em Aberto</p>
                          <p className="text-lg font-bold">{formatCurrency(selectedEmpresa.valorEmAberto || 0)}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Dias Inadimplente</p>
                          <p className="text-lg font-bold">{selectedEmpresa.diasInadimplente || 0}</p>
                        </div>
                      </div>
                      {selectedEmpresa.historico && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Histórico</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                            {selectedEmpresa.historico.map((h, i) => <li key={i}>{h}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setSelectedEmpresaId(null)}>Fechar</Button>
                      {selectedEmpresa.whatsapp ? (
                        <Button asChild>
                          <a href={getWhatsappLink(selectedEmpresa.whatsapp)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                          </a>
                        </Button>
                      ) : (
                        <Button onClick={() => {
                          setSelectedEmpresaId(null);
                          handleCorrigirCadastro({ id: selectedEmpresa.id, nome: selectedEmpresa.nome, missingFields: ["whatsapp"] }, "whatsapp");
                        }}>
                          <Phone className="h-4 w-4 mr-2" /> Adicionar WhatsApp
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog Corrigir Cadastro - Multi-field */}
            <Dialog open={!!editingEmpresa} onOpenChange={(open) => !open && setEditingEmpresa(null)}>
              <DialogContent className="max-w-md" role="dialog" aria-labelledby="corrigir-titulo">
                {editingEmpresa && (
                  <>
                    <DialogHeader>
                      <DialogTitle id="corrigir-titulo" className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-accent" />
                        Completar Cadastro
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os dados faltantes de {editingEmpresa.nome}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {editingEmpresa.missingFields.includes("whatsapp") && (
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp do responsável</Label>
                          <Input
                            id="whatsapp"
                            ref={whatsappInputRef}
                            placeholder="5511999999999"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Formato: código do país + DDD + número
                          </p>
                        </div>
                      )}
                      {editingEmpresa.missingFields.includes("responsavel") && (
                        <div className="space-y-2">
                          <Label htmlFor="responsavel">Nome do responsável</Label>
                          <Input
                            id="responsavel"
                            ref={responsavelInputRef}
                            placeholder="Nome completo"
                            value={formData.responsavel}
                            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                          />
                        </div>
                      )}
                      {editingEmpresa.missingFields.includes("dataFundacao") && (
                        <div className="space-y-2">
                          <Label htmlFor="dataFundacao">Data de fundação</Label>
                          <Input
                            id="dataFundacao"
                            ref={dataFundacaoInputRef}
                            type="date"
                            value={formData.dataFundacao}
                            onChange={(e) => setFormData({ ...formData, dataFundacao: e.target.value })}
                          />
                        </div>
                      )}
                      {editingEmpresa.missingFields.includes("aniversarioResponsavel") && (
                        <div className="space-y-2">
                          <Label htmlFor="aniversarioResponsavel">Data de nascimento do responsável</Label>
                          <Input
                            id="aniversarioResponsavel"
                            ref={aniversarioInputRef}
                            type="date"
                            value={formData.aniversarioResponsavel}
                            onChange={(e) => setFormData({ ...formData, aniversarioResponsavel: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setEditingEmpresa(null)}>Cancelar</Button>
                      <Button onClick={handleSaveForm}>Salvar alterações</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
