import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, Phone } from "lucide-react";

// Types and data
import { PeriodoFiltro, PrioridadeItem } from "@/components/dashboard/types";
import { empresas, dashboardKPIs, proximosVencimentos, agendaRelacionamento, mapaInadimplencia } from "@/components/dashboard/data";
import { formatCurrency, getWhatsappLink, ordenarPorPrioridade, getResponsavel } from "@/components/dashboard/utils";

// Components
import { VisaoExecutiva } from "@/components/dashboard/VisaoExecutiva";
import { PrioridadesHoje } from "@/components/dashboard/PrioridadesHoje";
import { AgendaRelacionamento } from "@/components/dashboard/AgendaRelacionamento";
import { MapaInadimplencia } from "@/components/dashboard/MapaInadimplencia";
import { CRMPrioritario } from "@/components/dashboard/CRMPrioritario";

const Dashboard = () => {
  // State
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("7dias");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<PrioridadeItem | null>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState<PrioridadeItem | null>(null);
  const [whatsappDraft, setWhatsappDraft] = useState("");

  // Todas as prioridades ordenadas
  const todasPrioridades = useMemo(() => ordenarPorPrioridade(empresas), []);

  // Top 5 para "Prioridades de Hoje"
  const prioridadesHoje = useMemo(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return todasPrioridades.filter(e => 
        e.nome.toLowerCase().includes(query) ||
        getResponsavel(e)?.nome?.toLowerCase().includes(query) ||
        e.whatsapp?.includes(query)
      ).slice(0, 5);
    }
    return todasPrioridades.slice(0, 5);
  }, [searchQuery, todasPrioridades]);

  // Empresas 6-50 para CRM Prioritário
  const empresasCRM = useMemo(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return todasPrioridades.filter(e => 
        e.nome.toLowerCase().includes(query) ||
        getResponsavel(e)?.nome?.toLowerCase().includes(query) ||
        e.whatsapp?.includes(query)
      ).slice(5);
    }
    return todasPrioridades.slice(5);
  }, [searchQuery, todasPrioridades]);

  const periodos: { value: PeriodoFiltro; label: string }[] = [
    { value: "hoje", label: "Hoje" },
    { value: "7dias", label: "7 dias" },
    { value: "30dias", label: "30 dias" },
  ];

  const handleCompletarCadastro = (empresa: PrioridadeItem) => {
    setEditingWhatsapp(empresa);
    setWhatsappDraft(empresa.whatsapp || "");
  };

  const handleSaveWhatsapp = () => {
    console.log("Salvando WhatsApp:", whatsappDraft, "para empresa:", editingWhatsapp?.nome);
    setEditingWhatsapp(null);
    setWhatsappDraft("");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto w-full">
            
            {/* A) Header + Contexto - Compacto e alinhado */}
            <header className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Painel do Sindicato</h1>
                  <p className="text-sm text-muted-foreground">Acompanhamento diário de adimplência e relacionamento</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                    {periodos.map((p) => (
                      <Button
                        key={p.value}
                        variant={periodo === p.value ? "default" : "ghost"}
                        size="sm"
                        className={periodo === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
                        onClick={() => setPeriodo(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar empresa, responsável..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-card border-border"
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* B) Visão Executiva - KPIs */}
            <VisaoExecutiva
              adimplencia={dashboardKPIs.adimplencia}
              adimplenciaAnterior={dashboardKPIs.adimplenciaAnterior}
              valorEmRisco={dashboardKPIs.valorEmRisco}
              valorEmRiscoAnterior={dashboardKPIs.valorEmRiscoAnterior}
              empresasCriticas={dashboardKPIs.empresasCriticas}
              proximosVencimentos15d={dashboardKPIs.proximosVencimentos15d}
              proximosEventos7d={dashboardKPIs.proximosEventos7d}
            />

            {/* C) Prioridades de Hoje - Top 5 */}
            <PrioridadesHoje
              prioridades={prioridadesHoje}
              onVerDetalhes={(empresa) => setSelectedEmpresa(empresa)}
              onCompletarCadastro={handleCompletarCadastro}
            />

            {/* D) Agenda de Relacionamento + E) Mapa de Inadimplência */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AgendaRelacionamento agenda={agendaRelacionamento} />
              <MapaInadimplencia 
                mapaInadimplencia={mapaInadimplencia} 
                proximosVencimentos={proximosVencimentos} 
              />
            </div>

            {/* F) CRM Prioritário - Empresas 6+ */}
            {empresasCRM.length > 0 && (
              <CRMPrioritario
                empresas={empresasCRM}
                onVerDetalhes={(empresa) => setSelectedEmpresa(empresa)}
              />
            )}

            {/* Dialog Detalhes */}
            <Dialog open={!!selectedEmpresa} onOpenChange={(open) => !open && setSelectedEmpresa(null)}>
              <DialogContent className="max-w-lg">
                {selectedEmpresa && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {selectedEmpresa.nome}
                        <Badge className={selectedEmpresa.selo === "Crítico" ? "bg-destructive" : selectedEmpresa.selo === "Atenção" ? "bg-amber-500" : "bg-accent"}>
                          {selectedEmpresa.selo}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>{selectedEmpresa.motivo}</DialogDescription>
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
                      <div className="flex flex-wrap gap-2">
                        {selectedEmpresa.chips.map((chip, i) => (
                          <Badge key={i} variant="outline">{chip}</Badge>
                        ))}
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
                      <Button variant="outline" onClick={() => setSelectedEmpresa(null)}>Fechar</Button>
                      {selectedEmpresa.whatsapp ? (
                        <Button asChild>
                          <a href={getWhatsappLink(selectedEmpresa.whatsapp)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                          </a>
                        </Button>
                      ) : (
                        <Button onClick={() => { setSelectedEmpresa(null); handleCompletarCadastro(selectedEmpresa); }}>
                          <Phone className="h-4 w-4 mr-2" /> Adicionar WhatsApp
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog Completar Cadastro */}
            <Dialog open={!!editingWhatsapp} onOpenChange={(open) => !open && setEditingWhatsapp(null)}>
              <DialogContent className="max-w-md">
                {editingWhatsapp && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-accent" />
                        Completar Cadastro
                      </DialogTitle>
                      <DialogDescription>
                        Adicione o WhatsApp para {editingWhatsapp.nome}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                        <Input
                          id="whatsapp"
                          placeholder="5511999999999"
                          value={whatsappDraft}
                          onChange={(e) => setWhatsappDraft(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formato: código do país + DDD + número (ex: 5585999999999)
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setEditingWhatsapp(null)}>Cancelar</Button>
                      <Button onClick={handleSaveWhatsapp} disabled={!whatsappDraft}>Salvar WhatsApp</Button>
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