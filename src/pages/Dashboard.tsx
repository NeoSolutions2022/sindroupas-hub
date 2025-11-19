import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertCircle,
  ArrowRight,
  BadgeInfo,
  BarChart3,
  Building2,
  CalendarClock,
  ChartNoAxesColumn,
  CircleAlert,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Dashboard = () => {
  const navigate = useNavigate();
  const inadimplenciaPercentual =
    (dashboardData.kpis.empresasInadimplentes / dashboardData.kpis.empresasAtivas) * 100;

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

            <section aria-label="Indicadores principais" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#E1E8D3] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#7E8C5E]" />
                    Receita do mês
                  </CardTitle>
                  <Badge variant="secondary" className="bg-[#DCE7CB] text-primary">
                    +18% vs mês anterior
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(dashboardData.kpis.receitaMes)}
                  </div>
                  <p className="text-xs text-muted-foreground">Dados do Financeiro</p>
                </CardContent>
              </Card>

              <Card className="border-[#E1E8D3] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[#7E8C5E]" />
                    Boletos pagos
                  </CardTitle>
                  <Badge variant="outline" className="text-[#7E8C5E] border-[#7E8C5E] bg-white">
                    de {dashboardData.kpis.boletosEmitidosMes} emitidos
                  </Badge>
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
                  <Badge variant="secondary" className="bg-[#FFF7E6] text-amber-700 border border-amber-200">
                    {dashboardData.kpis.boletosVencidos} vencidos
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{dashboardData.kpis.boletosEmAberto}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.kpis.boletosVencidos} vencidos •
                    {` ${dashboardData.kpis.boletosEmAberto - dashboardData.kpis.boletosVencidos} a vencer`}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#E1E8D3] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Índice de inadimplência
                  </CardTitle>
                  <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                    Carteira ativa
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">
                    {dashboardData.kpis.inadimplenciaPercentual}%
                  </div>
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
                      <p className="text-2xl font-semibold text-amber-700">
                        {dashboardData.kpis.empresasInadimplentes}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E1E8D3] bg-white p-3">
                      <p className="text-xs text-muted-foreground">Empresas em dia</p>
                      <p className="text-2xl font-semibold text-green-700">
                        {dashboardData.kpis.empresasAtivas - dashboardData.kpis.empresasInadimplentes}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E1E8D3] bg-white p-3">
                      <p className="text-xs text-muted-foreground">Ticket médio mensal</p>
                      <p className="text-xl font-semibold text-primary">R$ 580,00</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Inadimplentes vs Em dia</span>
                      <span>
                        {dashboardData.kpis.empresasInadimplentes} / {dashboardData.kpis.empresasAtivas}
                      </span>
                    </div>
                    <Progress value={inadimplenciaPercentual} className="h-3 bg-[#E1E8D3]" />
                    <p className="text-xs text-muted-foreground">
                      {inadimplenciaPercentual.toFixed(1)}% da carteira está inadimplente
                    </p>
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
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100">
                    Risco monitorado
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Empresas inadimplentes</p>
                        <p className="text-2xl font-semibold text-red-700">
                          {dashboardData.inadimplencia.empresasInadimplentes}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-700" aria-label="Empresas inadimplentes">
                        Carteira
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-[#FFF7E6] px-4 py-3">
                      <div>
                        <p className="text-sm text-amber-700">Casos &gt; 60 dias</p>
                        <p className="text-2xl font-semibold text-amber-700">
                          {dashboardData.inadimplencia.casosAcima60d}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-white">
                        Prioridade
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor total em atraso</p>
                        <p className="text-2xl font-semibold text-primary">
                          {formatCurrency(dashboardData.inadimplencia.valorTotalAtraso)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-[#DCE7CB] text-primary">
                        + atenção
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-white px-4 py-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Parcelas em atraso</p>
                        <p className="text-2xl font-semibold text-primary">
                          {dashboardData.inadimplencia.parcelasAtrasadas}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[#7E8C5E] border-[#7E8C5E] bg-white">
                        Financeiro
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-primary">Top 3 empresas em risco</p>
                    <div className="space-y-2">
                      {dashboardData.inadimplencia.topRisco.map((item) => (
                        <div
                          key={item.empresa}
                          className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] px-3 py-2"
                        >
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
                      <Link to="/dashboard/financeiro">
                        Ver detalhes no Financeiro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-[#DCE7CB] text-primary"
                      aria-label="Abrir CRM para casos críticos"
                      onClick={() => navigate("/dashboard/crm")}
                    >
                      Abrir CRM
                      <BadgeInfo className="ml-2 h-4 w-4" />
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
                              <Badge
                                variant="secondary"
                                className={
                                  item.status === "Em atraso"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : item.status === "Hoje"
                                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                                      : "bg-[#DCE7CB] text-primary border border-[#E1E8D3]"
                                }
                              >
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
                    <Button
                      className="flex items-center justify-center gap-2 bg-[#1C1C1C] text-white hover:bg-black"
                      onClick={() => navigate("/dashboard/financeiro?wizard=novo-boleto")}
                      aria-label="Criar boleto"
                    >
                      <Layers className="h-4 w-4" />
                      Criar boleto
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2 bg-[#DCE7CB] text-primary"
                      onClick={() => navigate("/dashboard/empresas?filtro=inadimplentes")}
                      aria-label="Ver empresas inadimplentes"
                    >
                      <CircleAlert className="h-4 w-4" />
                      Ver empresas inadimplentes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 border-[#7E8C5E] text-primary"
                      onClick={() => navigate("/dashboard/crm")}
                      aria-label="Abrir CRM"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Abrir CRM
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 border-[#7E8C5E] text-primary"
                      onClick={() => navigate("/dashboard/empresas?filtro=dados-incompletos")}
                      aria-label="Atualizar cadastro de empresas"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Atualizar cadastro de empresas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
