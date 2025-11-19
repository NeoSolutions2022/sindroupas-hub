import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FileDown, FileText, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BoletoRegistro, HistoricoContribuicao, getFinanceiroData, saveFinanceiroData } from "@/lib/financeiro-data";

const FinanceiroContribuicao = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [anoFiltro, setAnoFiltro] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const initialData = useMemo(() => getFinanceiroData(), []);
  const [boletos] = useState<BoletoRegistro[]>(initialData.boletos);
  const [historico, setHistorico] = useState<HistoricoContribuicao[]>(initialData.historico);

  useEffect(() => {
    saveFinanceiroData({ boletos, historico });
  }, [boletos, historico]);

  const historicoFiltrado = useMemo(() => {
    return historico.filter((item) => {
      const matchAno = !anoFiltro || item.ano.includes(anoFiltro);
      const matchEmpresa = !empresaFiltro || item.empresa.toLowerCase().includes(empresaFiltro.toLowerCase());
      return matchAno && matchEmpresa;
    });
  }, [anoFiltro, empresaFiltro, historico]);

  const handleExport = (formato: "CSV" | "PDF") => {
    toast({
      title: "Exportação gerada (mock)",
      description: `Arquivo ${formato} pronto para download (mock).`,
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Financeiro / Contribuição Assistencial</p>
                <h1 className="text-3xl font-bold">Histórico de Contribuição Assistencial</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/dashboard/financeiro") }>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Financeiro
                </Button>
                <Button className="bg-[#00A86B] hover:bg-[#00A86B]/90" onClick={() => navigate("/dashboard/financeiro") }>
                  + Criar boleto
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="anoFiltro">Ano</Label>
                    <Input
                      id="anoFiltro"
                      placeholder="2025"
                      value={anoFiltro}
                      onChange={(e) => setAnoFiltro(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="empresaFiltro">Empresa</Label>
                    <Input
                      id="empresaFiltro"
                      placeholder="Busque por nome"
                      value={empresaFiltro}
                      onChange={(e) => setEmpresaFiltro(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar
                  </Button>
                  <Button variant="outline" onClick={() => { setAnoFiltro(""); setEmpresaFiltro(""); }}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Registros</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExport("CSV")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("PDF")}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ano</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Periodicidade</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead>Base (R$)</TableHead>
                        <TableHead>Percentual (%)</TableHead>
                        <TableHead>Descontos (R$)</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoFiltrado.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        historicoFiltrado.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.ano}</TableCell>
                            <TableCell className="font-medium">{item.empresa}</TableCell>
                            <TableCell>{item.periodicidade}</TableCell>
                            <TableCell>{item.parcelas}</TableCell>
                            <TableCell>R$ {item.base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{item.percentual}%</TableCell>
                            <TableCell>R$ {item.descontos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{item.vencimento}</TableCell>
                            <TableCell>{item.situacao}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FinanceiroContribuicao;
