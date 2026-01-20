import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, CalendarDays, TrendingDown, Copy, Check, 
  Building2, User, ChevronRight, Search, AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

// Types and data
import { PeriodoFiltro, PrioridadeItem, AgendaItem } from "@/components/dashboard/types";
import { empresas, dashboardKPIs, proximosVencimentos, agendaRelacionamento, mapaInadimplencia, entradasSaidas } from "@/components/dashboard/data";
import { formatCurrency, formatDateFull, getWhatsappLink, ordenarPorPrioridade, getResponsavel } from "@/components/dashboard/utils";

// Components
import { VisaoExecutiva } from "@/components/dashboard/VisaoExecutiva";
import { PrioridadesHoje } from "@/components/dashboard/PrioridadesHoje";

const Dashboard = () => {
  // State
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("7dias");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<PrioridadeItem | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Prioridades calculadas
  const prioridades = useMemo(() => {
    const ordenadas = ordenarPorPrioridade(empresas);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return ordenadas.filter(e => 
        e.nome.toLowerCase().includes(query) ||
        getResponsavel(e)?.nome?.toLowerCase().includes(query) ||
        e.whatsapp?.includes(query)
      );
    }
    return ordenadas.slice(0, 5); // Top 5
  }, [searchQuery]);

  // Copy message handler
  const handleCopyMessage = (message: string, id: string) => {
    navigator.clipboard.writeText(message);
    setCopiedMessage(id);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const periodos: { value: PeriodoFiltro; label: string }[] = [
    { value: "hoje", label: "Hoje" },
    { value: "7dias", label: "7 dias" },
    { value: "30dias", label: "30 dias" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto w-full">
            
            {/* A) Header + Contexto */}
            <header className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Painel do Sindicato</h1>
                <p className="text-sm text-muted-foreground">Acompanhamento diário de adimplência e relacionamento</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="relative w-full sm:max-w-xs">
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

            {/* C) Prioridades de Hoje */}
            <PrioridadesHoje
              prioridades={prioridades}
              onVerDetalhes={(empresa) => setSelectedEmpresa(empresa)}
            />

            {/* D) Agenda de Relacionamento + E) Financeiro */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Agenda de Relacionamento */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="h-5 w-5 text-accent" />
                      Agenda de Relacionamento
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">7 dias</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agendaRelacionamento.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento nos próximos 7 dias</p>
                  ) : (
                    agendaRelacionamento.map((item, idx) => {
                      const whatsappLink = getWhatsappLink(item.whatsapp, item.sugestaoMensagem);
                      const isResponsavel = item.tipo === "responsavel";
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                          <div className="shrink-0 w-12 text-center">
                            <p className="text-lg font-bold text-foreground">{formatDateFull(item.data).split(" ")[0]}</p>
                            <p className="text-xs text-muted-foreground uppercase">{formatDateFull(item.data).split(" ")[1]}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isResponsavel ? <User className="h-3.5 w-3.5 text-muted-foreground" /> : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="font-medium text-sm text-foreground truncate">{item.nome}</span>
                            </div>
                            {item.empresa && <p className="text-xs text-muted-foreground">{item.empresa}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleCopyMessage(item.sugestaoMensagem, `${idx}`)}
                              >
                                {copiedMessage === `${idx}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                {copiedMessage === `${idx}` ? "Copiado!" : "Copiar msg"}
                              </Button>
                              {whatsappLink && (
                                <Button asChild size="sm" className="h-7 px-2 text-xs bg-primary">
                                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                                    <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Financeiro Resumo */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      Mapa de Inadimplência
                    </CardTitle>
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                      <Link to="/dashboard/financeiro">Ver todos <ChevronRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mapaInadimplencia} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="faixa" width={70} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {mapaInadimplencia.map((entry, index) => (
                            <Cell key={index} fill={index === 3 ? "hsl(var(--destructive))" : index === 2 ? "#f59e0b" : "hsl(var(--accent))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Próximos Vencimentos Compacto */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Próximos Vencimentos (15 dias)</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/30">
                            <TableHead className="text-xs py-2">Empresa</TableHead>
                            <TableHead className="text-xs py-2">Venc.</TableHead>
                            <TableHead className="text-xs py-2 text-right">Valor</TableHead>
                            <TableHead className="text-xs py-2 w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proximosVencimentos.slice(0, 3).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs py-2 font-medium">{item.empresa}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant={item.status === "Hoje" ? "destructive" : "outline"} className="text-xs px-1.5 py-0">
                                  {formatDateFull(item.data)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2 text-right">{formatCurrency(item.valor)}</TableCell>
                              <TableCell className="py-2">
                                {item.whatsapp && (
                                  <Button asChild variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <a href={getWhatsappLink(item.whatsapp)} target="_blank" rel="noreferrer">
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                      {selectedEmpresa.whatsapp && (
                        <Button asChild>
                          <a href={getWhatsappLink(selectedEmpresa.whatsapp)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                          </a>
                        </Button>
                      )}
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
