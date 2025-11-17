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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingDown, FileDown, Eye, Calculator, FileText, Plus, Edit, Trash2, Search, Save, RotateCcw, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Mock de empresas para autocomplete
const mockEmpresas = [
  { id: "emp1", nome: "Estilo Nordeste Ltda", cnpj: "12.345.678/0001-90" },
  { id: "emp2", nome: "ModaSul Indústria e Comércio S.A.", cnpj: "98.765.432/0001-10" },
  { id: "emp3", nome: "Confecções Aurora", cnpj: "11.222.333/0001-44" },
  { id: "emp4", nome: "Costura Viva", cnpj: "55.666.777/0001-88" },
  { id: "emp5", nome: "Têxtil Nordeste", cnpj: "99.888.777/0001-66" },
];

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

// Tipos
interface Faixa {
  id: string;
  min: number;
  max: number;
  valor: number;
}

interface BoletoForm {
  tipo: "mensalidade" | "contribuicao" | "";
  empresaId: string;
  empresaNome: string;
  competenciaInicial: string;
  competenciaFinal: string;
  dataVencimento: string;
  faixaId: string;
  unificarCompetencias: string;
  mensagemPersonalizada: string;
}

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

  // Estado para Faixas
  const [faixas, setFaixas] = useState<Faixa[]>([
    { id: "fx1", min: 1, max: 20, valor: 600 },
    { id: "fx2", min: 21, max: 50, valor: 850 },
  ]);
  const [faixaDialogOpen, setFaixaDialogOpen] = useState(false);
  const [faixaToEdit, setFaixaToEdit] = useState<Faixa | null>(null);
  const [faixaToDelete, setFaixaToDelete] = useState<Faixa | null>(null);
  const [faixaForm, setFaixaForm] = useState({ min: "", max: "", valor: "" });

  // Estado para Wizard de Boletos
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [boletoForm, setBoletoForm] = useState<BoletoForm>({
    tipo: "",
    empresaId: "",
    empresaNome: "",
    competenciaInicial: "",
    competenciaFinal: "",
    dataVencimento: "",
    faixaId: "",
    unificarCompetencias: "Não",
    mensagemPersonalizada: "",
  });
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false);
  const [previaBoleto, setPreviaBoleto] = useState<number | null>(null);
  const [boletos, setBoletos] = useState(mockFinanceiro.boletos);

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

  // Funções para Faixas
  const handleOpenFaixaDialog = (faixa?: Faixa) => {
    if (faixa) {
      setFaixaToEdit(faixa);
      setFaixaForm({
        min: faixa.min.toString(),
        max: faixa.max.toString(),
        valor: faixa.valor.toString(),
      });
    } else {
      setFaixaToEdit(null);
      setFaixaForm({ min: "", max: "", valor: "" });
    }
    setFaixaDialogOpen(true);
  };

  const handleSaveFaixa = () => {
    const min = parseInt(faixaForm.min);
    const max = parseInt(faixaForm.max);
    const valor = parseFloat(faixaForm.valor);

    if (isNaN(min) || isNaN(max) || isNaN(valor)) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios e devem ser números válidos.",
        variant: "destructive",
      });
      return;
    }

    if (min >= max) {
      toast({
        title: "Erro",
        description: "O valor mínimo deve ser menor que o máximo.",
        variant: "destructive",
      });
      return;
    }

    // Verificar sobreposição
    const hasOverlap = faixas.some((f) => {
      if (faixaToEdit && f.id === faixaToEdit.id) return false;
      return (min >= f.min && min <= f.max) || (max >= f.min && max <= f.max) ||
             (min <= f.min && max >= f.max);
    });

    if (hasOverlap) {
      toast({
        title: "Erro",
        description: "Esta faixa se sobrepõe a uma faixa existente.",
        variant: "destructive",
      });
      return;
    }

    if (faixaToEdit) {
      setFaixas(faixas.map((f) => f.id === faixaToEdit.id ? { ...f, min, max, valor } : f));
      toast({
        title: "Faixa atualizada",
        description: "A faixa foi atualizada com sucesso.",
      });
    } else {
      const newFaixa: Faixa = {
        id: `fx${Date.now()}`,
        min,
        max,
        valor,
      };
      setFaixas([...faixas, newFaixa]);
      toast({
        title: "Faixa criada",
        description: "A nova faixa foi criada com sucesso.",
      });
    }

    setFaixaDialogOpen(false);
    setFaixaForm({ min: "", max: "", valor: "" });
    setFaixaToEdit(null);
  };

  const handleDeleteFaixa = (faixa: Faixa) => {
    setFaixas(faixas.filter((f) => f.id !== faixa.id));
    setFaixaToDelete(null);
    toast({
      title: "Faixa excluída",
      description: "A faixa foi excluída com sucesso.",
    });
  };

  // Funções para Wizard de Boletos
  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setBoletoForm({
      tipo: "",
      empresaId: "",
      empresaNome: "",
      competenciaInicial: "",
      competenciaFinal: "",
      dataVencimento: "",
      faixaId: "",
      unificarCompetencias: "Não",
      mensagemPersonalizada: "",
    });
    setEmpresaSearch("");
    setPreviaBoleto(null);
  };

  const handleSelectEmpresa = (empresa: typeof mockEmpresas[0]) => {
    setBoletoForm({
      ...boletoForm,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
    });
    setEmpresaSearch(`${empresa.nome} - ${empresa.cnpj}`);
    setShowEmpresaSuggestions(false);
  };

  const empresasFiltradas = mockEmpresas.filter(
    (emp) =>
      emp.nome.toLowerCase().includes(empresaSearch.toLowerCase()) ||
      emp.cnpj.includes(empresaSearch)
  );

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (boletoForm.tipo !== "mensalidade" || !boletoForm.empresaId) {
        toast({
          title: "Campos obrigatórios",
          description: "Selecione o tipo Mensalidade e uma empresa.",
          variant: "destructive",
        });
        return;
      }
    } else if (wizardStep === 2) {
      if (previaBoleto === null) {
        toast({
          title: "Pesquisa obrigatória",
          description: "Clique em 'Pesquisar' antes de avançar.",
          variant: "destructive",
        });
        return;
      }
    }
    setWizardStep(wizardStep + 1);
  };

  const handlePesquisarBoleto = () => {
    const { competenciaInicial, competenciaFinal, dataVencimento, faixaId } = boletoForm;

    if (!competenciaInicial || !competenciaFinal || !dataVencimento || !faixaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const faixaSelecionada = faixas.find((f) => f.id === faixaId);
    if (faixaSelecionada) {
      setPreviaBoleto(faixaSelecionada.valor);
      toast({
        title: "Pesquisa concluída",
        description: `Prévia: R$ ${faixaSelecionada.valor.toFixed(2)}`,
      });
    }
  };

  const handleLimparEtapa2 = () => {
    setBoletoForm({
      ...boletoForm,
      competenciaInicial: "",
      competenciaFinal: "",
      dataVencimento: "",
      faixaId: "",
      unificarCompetencias: "Não",
      mensagemPersonalizada: "",
    });
    setPreviaBoleto(null);
  };

  const handleEmitirBoleto = () => {
    const faixaSelecionada = faixas.find((f) => f.id === boletoForm.faixaId);
    const novoBoleto = {
      id: boletos.length + 1,
      empresa: boletoForm.empresaNome,
      valor: faixaSelecionada?.valor || 0,
      vencimento: boletoForm.dataVencimento,
      status: "Pendente",
    };

    setBoletos([...boletos, novoBoleto]);
    toast({
      title: "Boleto emitido com sucesso (mock)",
      description: `Boleto para ${boletoForm.empresaNome} criado.`,
    });
    resetWizard();
  };

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
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="boletos">Controle de Boletos</TabsTrigger>
                <TabsTrigger value="faixas">Faixas</TabsTrigger>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle>Controle de Boletos</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setWizardOpen(true)}
                          className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar boleto
                        </Button>
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

              {/* Tab de Faixas */}
              <TabsContent value="faixas">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Gestão de Faixas</CardTitle>
                      <Button onClick={() => handleOpenFaixaDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Faixa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mín Funcionários</TableHead>
                            <TableHead>Máx Funcionários</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {faixas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Nenhuma faixa cadastrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            faixas.map((faixa) => (
                              <TableRow key={faixa.id}>
                                <TableCell>{faixa.min}</TableCell>
                                <TableCell>{faixa.max}</TableCell>
                                <TableCell>R$ {faixa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenFaixaDialog(faixa)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setFaixaToDelete(faixa)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Dialog de Faixas */}
            <Dialog open={faixaDialogOpen} onOpenChange={setFaixaDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{faixaToEdit ? "Editar Faixa" : "Nova Faixa"}</DialogTitle>
                  <DialogDescription>
                    Defina o intervalo de funcionários e o valor correspondente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minFunc">Mín Funcionários*</Label>
                    <Input
                      id="minFunc"
                      type="number"
                      placeholder="Ex: 1"
                      value={faixaForm.min}
                      onChange={(e) => setFaixaForm({ ...faixaForm, min: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxFunc">Máx Funcionários*</Label>
                    <Input
                      id="maxFunc"
                      type="number"
                      placeholder="Ex: 20"
                      value={faixaForm.max}
                      onChange={(e) => setFaixaForm({ ...faixaForm, max: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorFaixa">Valor (R$)*</Label>
                    <Input
                      id="valorFaixa"
                      type="number"
                      placeholder="Ex: 600.00"
                      value={faixaForm.valor}
                      onChange={(e) => setFaixaForm({ ...faixaForm, valor: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFaixaDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveFaixa}>
                    {faixaToEdit ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Alert Dialog de Exclusão de Faixa */}
            <AlertDialog open={!!faixaToDelete} onOpenChange={() => setFaixaToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Faixa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta faixa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => faixaToDelete && handleDeleteFaixa(faixaToDelete)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Wizard de Criação de Boletos */}
            <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Boleto</DialogTitle>
                  <DialogDescription>
                    Etapa {wizardStep} de 3
                  </DialogDescription>
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-2 rounded ${
                          step <= wizardStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </DialogHeader>

                {/* Etapa 1: Tipo do Boleto */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Tipo do Boleto*</Label>
                      <RadioGroup value={boletoForm.tipo} onValueChange={(value) => setBoletoForm({ ...boletoForm, tipo: value as any })}>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value="mensalidade" id="mensalidade" />
                          <Label htmlFor="mensalidade" className="cursor-pointer flex-1">
                            Mensalidade (por Faixa)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg opacity-50 bg-muted cursor-not-allowed">
                          <RadioGroupItem value="contribuicao" id="contribuicao" disabled />
                          <Label htmlFor="contribuicao" className="flex-1">
                            Contribuição Assistencial 🔒
                            <span className="block text-xs text-muted-foreground mt-1">
                              Fluxo será ativado em atualização futura
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="empresaSearch" className="text-base font-semibold">Empresa*</Label>
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="empresaSearch"
                            placeholder="Digite o nome ou CNPJ da empresa"
                            value={empresaSearch}
                            onChange={(e) => {
                              setEmpresaSearch(e.target.value);
                              setShowEmpresaSuggestions(true);
                            }}
                            onFocus={() => setShowEmpresaSuggestions(true)}
                          />
                        </div>
                        {showEmpresaSuggestions && empresaSearch && empresasFiltradas.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {empresasFiltradas.map((empresa) => (
                              <div
                                key={empresa.id}
                                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                                onClick={() => handleSelectEmpresa(empresa)}
                              >
                                <div className="font-medium">{empresa.nome}</div>
                                <div className="text-sm text-muted-foreground">{empresa.cnpj}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {boletoForm.empresaNome && (
                        <div className="text-sm text-muted-foreground">
                          ✓ Empresa selecionada: {boletoForm.empresaNome}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Etapa 2: Detalhes (Mensalidade) */}
                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalhes do Boleto - Mensalidade por Faixa</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="compInicial">Competência Inicial* (mm/aaaa)</Label>
                            <Input
                              id="compInicial"
                              placeholder="10/2025"
                              value={boletoForm.competenciaInicial}
                              onChange={(e) => setBoletoForm({ ...boletoForm, competenciaInicial: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="compFinal">Competência Final* (mm/aaaa)</Label>
                            <Input
                              id="compFinal"
                              placeholder="12/2025"
                              value={boletoForm.competenciaFinal}
                              onChange={(e) => setBoletoForm({ ...boletoForm, competenciaFinal: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dataVenc">Data Vencimento* (dd/mm/aaaa)</Label>
                            <Input
                              id="dataVenc"
                              placeholder="25/11/2025"
                              value={boletoForm.dataVencimento}
                              onChange={(e) => setBoletoForm({ ...boletoForm, dataVencimento: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="faixa">Faixa*</Label>
                            <Select value={boletoForm.faixaId} onValueChange={(value) => setBoletoForm({ ...boletoForm, faixaId: value })}>
                              <SelectTrigger id="faixa">
                                <SelectValue placeholder="Selecione uma faixa" />
                              </SelectTrigger>
                              <SelectContent>
                                {faixas.map((faixa) => (
                                  <SelectItem key={faixa.id} value={faixa.id}>
                                    {faixa.min}–{faixa.max} • R$ {faixa.valor.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unificar">Unificar Competências*</Label>
                          <Select value={boletoForm.unificarCompetencias} onValueChange={(value) => setBoletoForm({ ...boletoForm, unificarCompetencias: value })}>
                            <SelectTrigger id="unificar">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mensagem">Mensagem Personalizada</Label>
                          <Input
                            id="mensagem"
                            placeholder="Adicione uma mensagem opcional"
                            value={boletoForm.mensagemPersonalizada}
                            onChange={(e) => setBoletoForm({ ...boletoForm, mensagemPersonalizada: e.target.value })}
                          />
                        </div>

                        {previaBoleto !== null && (
                          <div className="bg-accent/20 p-4 rounded-lg">
                            <p className="text-sm font-medium">Prévia de valor:</p>
                            <p className="text-2xl font-bold text-primary">
                              R$ {previaBoleto.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Competências: {boletoForm.competenciaInicial} a {boletoForm.competenciaFinal}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={handlePesquisarBoleto} className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                            <Search className="h-4 w-4 mr-2" />
                            Pesquisar
                          </Button>
                          <Button variant="outline" onClick={handleLimparEtapa2}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Limpar
                          </Button>
                          <Button variant="outline" onClick={() => {
                            toast({ title: "Filtro salvo (mock)", description: "Funcionalidade em desenvolvimento" });
                          }}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Filtro
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Etapa 3: Revisão e Emissão */}
                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Revisão e Emissão</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-muted-foreground">Empresa:</p>
                            <p className="font-medium">{boletoForm.empresaNome}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Tipo:</p>
                            <p className="font-medium">Mensalidade por Faixa</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Faixa selecionada:</p>
                            <p className="font-medium">
                              {faixas.find((f) => f.id === boletoForm.faixaId)
                                ? `${faixas.find((f) => f.id === boletoForm.faixaId)!.min}–${faixas.find((f) => f.id === boletoForm.faixaId)!.max} • R$ ${faixas.find((f) => f.id === boletoForm.faixaId)!.valor.toFixed(2)}`
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Competências:</p>
                            <p className="font-medium">{boletoForm.competenciaInicial} a {boletoForm.competenciaFinal}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Unificar Competências:</p>
                            <p className="font-medium">{boletoForm.unificarCompetencias}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Data de Vencimento:</p>
                            <p className="font-medium">{boletoForm.dataVencimento}</p>
                          </div>
                          {boletoForm.mensagemPersonalizada && (
                            <div className="col-span-2">
                              <p className="font-semibold text-muted-foreground">Mensagem Personalizada:</p>
                              <p className="font-medium">{boletoForm.mensagemPersonalizada}</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20 mt-4">
                          <p className="text-sm font-semibold text-muted-foreground">Valor estimado:</p>
                          <p className="text-3xl font-bold text-primary">
                            R$ {(previaBoleto || 0).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter className="flex justify-between">
                  <div>
                    {wizardStep > 1 && (
                      <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                        Voltar
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetWizard}>
                      Cancelar
                    </Button>
                    {wizardStep < 3 ? (
                      <Button onClick={handleNextStep}>
                        Próximo
                      </Button>
                    ) : (
                      <Button onClick={handleEmitirBoleto} className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                        Emitir
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Financeiro;
