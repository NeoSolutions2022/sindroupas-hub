import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingDown, FileDown, Eye, Calculator, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mockFinanceiro = {
  receitas: [
    { mes: "Janeiro", valor: 2100 },
    { mes: "Fevereiro", valor: 2800 },
    { mes: "Março", valor: 3200 },
  ],
  inadimplencia: 12,
  boletos: [
    { id: 1, empresa: "Estilo Nordeste", valor: 450, vencimento: "10/03/2025", status: "Pago" },
    { id: 2, empresa: "Costura Viva", valor: 450, vencimento: "15/03/2025", status: "Atrasado" },
    { id: 3, empresa: "Confecções Aurora", valor: 450, vencimento: "20/03/2025", status: "Pago" },
    { id: 4, empresa: "ModaSul Ltda", valor: 450, vencimento: "25/03/2025", status: "Atrasado" },
    { id: 5, empresa: "Têxtil Nordeste", valor: 450, vencimento: "30/03/2025", status: "Pago" },
  ],
};

const mockContribuicoes = [
  {
    id: 1,
    data: "2025-11-05",
    empresa: "Estilo Nordeste Ltda",
    percentual: 1.5,
    baseCalculo: 20000,
    valor: 300,
    situacao: "Paga"
  },
  {
    id: 2,
    data: "2025-10-10",
    empresa: "ModaSul Indústria e Comércio S.A.",
    percentual: 1.0,
    baseCalculo: 15000,
    valor: 150,
    situacao: "Emitida"
  },
  {
    id: 3,
    data: "2025-10-05",
    empresa: "Confecções Aurora",
    percentual: 2.0,
    baseCalculo: 12000,
    valor: 240,
    situacao: "Pendente"
  }
];

const dadosInadimplencia = [
  { name: "Em dia", value: 88, color: "hsl(var(--accent))" },
  { name: "Inadimplentes", value: 12, color: "hsl(var(--destructive))" },
];

const Financeiro = () => {
  const [mesFilter, setMesFilter] = useState("Todos");
  const [baseCalculo, setBaseCalculo] = useState("");
  const [percentual, setPercentual] = useState("");
  const [descontos, setDescontos] = useState("");
  const [valorCalculado, setValorCalculado] = useState(0);
  const [filterPeriodo, setFilterPeriodo] = useState("Todos");
  const [filterSituacao, setFilterSituacao] = useState("Todas");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredBoletos = mockFinanceiro.boletos.filter((boleto) => {
    if (mesFilter === "Todos") return true;
    return boleto.vencimento.includes(`/${mesFilter}/`);
  });

  const filteredContribuicoes = mockContribuicoes.filter((contrib) => {
    const matchesPeriodo = filterPeriodo === "Todos" || contrib.data.includes(filterPeriodo);
    const matchesSituacao = filterSituacao === "Todas" || contrib.situacao === filterSituacao;
    return matchesPeriodo && matchesSituacao;
  });

  const handleExport = (formato: "PDF" | "Excel" | "CSV") => {
    toast({
      title: "Exportação iniciada",
      description: `Relatório será exportado em ${formato}`,
    });
  };

  const handleCalcular = () => {
    const base = parseFloat(baseCalculo) || 0;
    const perc = parseFloat(percentual) || 0;
    const desc = parseFloat(descontos) || 0;
    const resultado = (base * perc / 100) - desc;
    setValorCalculado(resultado > 0 ? resultado : 0);
  };

  const handleGerarContribuicao = () => {
    if (valorCalculado > 0) {
      toast({
        title: "Contribuição gerada",
        description: "Contribuição salva no histórico com sucesso.",
      });
      setBaseCalculo("");
      setPercentual("");
      setDescontos("");
      setValorCalculado(0);
    } else {
      toast({
        title: "Erro",
        description: "Calcule o valor antes de gerar a contribuição.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Pago" ? (
      <Badge variant="default">Pago</Badge>
    ) : (
      <Badge variant="destructive">Atrasado</Badge>
    );
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case "Paga":
        return <Badge variant="default">Paga</Badge>;
      case "Emitida":
        return <Badge className="bg-blue-100 text-blue-800">Emitida</Badge>;
      case "Pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{situacao}</Badge>;
    }
  };

  const totalReceita = mockFinanceiro.receitas.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Financeiro</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport("PDF")}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={() => handleExport("Excel")}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>

            <Tabs defaultValue="visao-geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-6">
                <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="boletos">Controle de Boletos</TabsTrigger>
                <TabsTrigger value="contribuicao">Contribuição Assistencial</TabsTrigger>
              </TabsList>

              <TabsContent value="visao-geral" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Receita Total (Trimestre)</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {totalReceita.toLocaleString("pt-BR")}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">
                        {mockFinanceiro.inadimplencia}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mockFinanceiro.receitas}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inadimplência</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dadosInadimplencia}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="hsl(var(--accent))"
                            dataKey="value"
                          >
                            {dadosInadimplencia.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="boletos">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Controle de Boletos</CardTitle>
                      <Select value={mesFilter} onValueChange={setMesFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filtrar por mês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todos">Todos</SelectItem>
                          <SelectItem value="01">Janeiro</SelectItem>
                          <SelectItem value="02">Fevereiro</SelectItem>
                          <SelectItem value="03">Março</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBoletos.map((boleto) => (
                            <TableRow key={boleto.id}>
                              <TableCell className="font-medium">{boleto.empresa}</TableCell>
                              <TableCell>R$ {boleto.valor.toLocaleString("pt-BR")}</TableCell>
                              <TableCell>{boleto.vencimento}</TableCell>
                              <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/dashboard/financeiro/${boleto.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detalhes
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contribuicao" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Simulador de Cálculo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baseCalculo">Base de Cálculo (R$)</Label>
                        <Input
                          id="baseCalculo"
                          type="number"
                          placeholder="10000"
                          value={baseCalculo}
                          onChange={(e) => {
                            setBaseCalculo(e.target.value);
                            handleCalcular();
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="percentual">Percentual (%)</Label>
                        <Input
                          id="percentual"
                          type="number"
                          placeholder="2.5"
                          value={percentual}
                          onChange={(e) => {
                            setPercentual(e.target.value);
                            handleCalcular();
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descontos">Descontos/Isenções (R$)</Label>
                        <Input
                          id="descontos"
                          type="number"
                          placeholder="0"
                          value={descontos}
                          onChange={(e) => {
                            setDescontos(e.target.value);
                            handleCalcular();
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Calculado</Label>
                        <div className="text-2xl font-bold text-primary pt-2">
                          R$ {valorCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button onClick={handleGerarContribuicao}>
                        Gerar Contribuição
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <CardTitle>Histórico por Empresa</CardTitle>
                      <div className="flex gap-2">
                        <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos</SelectItem>
                            <SelectItem value="2025-11">Nov/2025</SelectItem>
                            <SelectItem value="2025-10">Out/2025</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Situação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todas">Todas</SelectItem>
                            <SelectItem value="Paga">Paga</SelectItem>
                            <SelectItem value="Emitida">Emitida</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => handleExport("CSV")}>
                          <FileText className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport("PDF")}>
                          <FileDown className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Percentual</TableHead>
                            <TableHead>Base</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContribuicoes.map((contrib) => (
                            <TableRow key={contrib.id}>
                              <TableCell>{new Date(contrib.data).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell className="font-medium">{contrib.empresa}</TableCell>
                              <TableCell>{contrib.percentual}%</TableCell>
                              <TableCell>R$ {contrib.baseCalculo.toLocaleString("pt-BR")}</TableCell>
                              <TableCell>R$ {contrib.valor.toLocaleString("pt-BR")}</TableCell>
                              <TableCell>{getSituacaoBadge(contrib.situacao)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

export default Financeiro;
