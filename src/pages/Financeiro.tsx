import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingDown, FileDown, Eye } from "lucide-react";
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

const dadosInadimplencia = [
  { name: "Em dia", value: 88, color: "hsl(var(--accent))" },
  { name: "Inadimplentes", value: 12, color: "hsl(var(--destructive))" },
];

const Financeiro = () => {
  const [mesFilter, setMesFilter] = useState("Todos");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredBoletos = mockFinanceiro.boletos.filter((boleto) => {
    if (mesFilter === "Todos") return true;
    return boleto.vencimento.includes(`/${mesFilter}/`);
  });

  const handleExport = (formato: "PDF" | "Excel") => {
    toast({
      title: "Exportação iniciada",
      description: `Relatório será exportado em ${formato}`,
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "Pago" ? (
      <Badge variant="default">Pago</Badge>
    ) : (
      <Badge variant="destructive">Atrasado</Badge>
    );
  };

  const totalReceita = mockFinanceiro.receitas.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-center">
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
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Financeiro;
