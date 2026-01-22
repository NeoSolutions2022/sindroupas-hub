import { useMemo, useState, useRef, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

// Types and data
import { 
  empresas, 
  dashboardKPIs, 
  carteiraResumo, 
  empresasIncompletas, 
  calendarEvents,
  prioridadesOperacionais 
} from "@/components/dashboard/data";
import { formatCurrency, getWhatsappLink, getResponsavel } from "@/components/dashboard/utils";

// Components
import { NovasKPIs } from "@/components/dashboard/NovasKPIs";
import { PrioridadesOperacional, PrioridadeOperacional } from "@/components/dashboard/PrioridadesOperacional";
import { CalendarioMensal } from "@/components/dashboard/CalendarioMensal";
import { ResumoCarteira } from "@/components/dashboard/ResumoCarteira";
import { EmpresasIncompletas, EmpresaIncompleta } from "@/components/dashboard/EmpresasIncompletas";

const Dashboard = () => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
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
  }, [searchQuery]);

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
