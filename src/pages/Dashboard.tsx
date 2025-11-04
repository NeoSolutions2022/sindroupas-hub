import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Users, AlertCircle, Calendar, DollarSign, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockData = {
  kpis: {
    associadosAtivos: 70,
    inadimplentes: 8,
    eventosProximos: 3,
    receitasMes: 34250,
  },
  financeiro6m: [
    { mes: "Mai", receitas: 28000, despesas: 12500 },
    { mes: "Jun", receitas: 30500, despesas: 14000 },
    { mes: "Jul", receitas: 31800, despesas: 15200 },
    { mes: "Ago", receitas: 33600, despesas: 16000 },
    { mes: "Set", receitas: 35500, despesas: 17100 },
    { mes: "Out", receitas: 34250, despesas: 16850 },
  ],
  crescimento12m: [
    { mes: "Jan", filiacao: 3, cancelamento: 1 },
    { mes: "Fev", filiacao: 5, cancelamento: 0 },
    { mes: "Mar", filiacao: 4, cancelamento: 2 },
    { mes: "Abr", filiacao: 6, cancelamento: 1 },
    { mes: "Mai", filiacao: 7, cancelamento: 1 },
    { mes: "Jun", filiacao: 5, cancelamento: 0 },
    { mes: "Jul", filiacao: 8, cancelamento: 2 },
    { mes: "Ago", filiacao: 6, cancelamento: 1 },
    { mes: "Set", filiacao: 9, cancelamento: 1 },
    { mes: "Out", filiacao: 7, cancelamento: 0 },
    { mes: "Nov", filiacao: 8, cancelamento: 1 },
    { mes: "Dez", filiacao: 10, cancelamento: 2 },
  ],
  engajamentoEventos: [
    { tipo: "Assembleias", valor: 85 },
    { tipo: "Workshops", valor: 72 },
    { tipo: "Cursos", valor: 68 },
    { tipo: "Networking", valor: 90 },
    { tipo: "Palestras", valor: 75 },
  ],
  eventosRecentes: [
    { titulo: "Assembleia Geral", data: "2025-11-12", status: "Confirmado" },
    { titulo: "Workshop Compliance", data: "2025-11-21", status: "Inscrições Abertas" },
    { titulo: "Curso de Gestão", data: "2025-11-28", status: "Aguardando" },
  ],
  kpisFinanceiro: {
    boletosPagos: 62,
    boletosPendentes: 8,
    ticketMedio: 489.29,
  },
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do SindRoupas</p>
            </div>

            <Tabs defaultValue="visao-geral" className="space-y-6">
              <TabsList>
                <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="resumo-financeiro">Resumo Financeiro</TabsTrigger>
                <TabsTrigger value="indicadores-crescimento">Indicadores de Crescimento</TabsTrigger>
              </TabsList>

              {/* Visão Geral */}
              <TabsContent value="visao-geral" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Associados Ativos</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockData.kpis.associadosAtivos}</div>
                      <p className="text-xs text-muted-foreground">+5% em relação ao mês anterior</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">{mockData.kpis.inadimplentes}</div>
                      <p className="text-xs text-muted-foreground">11% do total</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockData.kpis.eventosProximos}</div>
                      <p className="text-xs text-muted-foreground">Nos próximos 30 dias</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        R$ {mockData.kpis.receitasMes.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-muted-foreground">-3% em relação ao mês anterior</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Eventos Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockData.eventosRecentes.map((evento, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{evento.titulo}</TableCell>
                              <TableCell>{new Date(evento.data).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                <Badge variant={evento.status === "Confirmado" ? "default" : "secondary"}>
                                  {evento.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resumo Financeiro */}
              <TabsContent value="resumo-financeiro" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Boletos Pagos</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockData.kpisFinanceiro.boletosPagos}</div>
                      <p className="text-xs text-muted-foreground">88% de taxa de pagamento</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Boletos Pendentes</CardTitle>
                      <Clock className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">
                        {mockData.kpisFinanceiro.boletosPendentes}
                      </div>
                      <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        R$ {mockData.kpisFinanceiro.ticketMedio.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Por associado/mês</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Receitas x Despesas (Últimos 6 Meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={mockData.financeiro6m}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
                        <Legend />
                        <Bar dataKey="receitas" fill="hsl(var(--accent))" name="Receitas" />
                        <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Indicadores de Crescimento */}
              <TabsContent value="indicadores-crescimento" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Novas Filiações e Cancelamentos (Últimos 12 Meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={mockData.crescimento12m}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="filiacao" stroke="hsl(var(--accent))" name="Filiações" strokeWidth={2} />
                        <Line type="monotone" dataKey="cancelamento" stroke="hsl(var(--destructive))" name="Cancelamentos" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engajamento em Eventos por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={mockData.engajamentoEventos}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="tipo" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Engajamento" dataKey="valor" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
