import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calculator, FileDown, FileText, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

const initialFaixas = [
  { id: "fx1", min: 1, max: 20, valor: 600 },
  { id: "fx2", min: 21, max: 50, valor: 850 },
];

const initialBoletos = [
  {
    id: "b1",
    tipo: "Mensalidade (por Faixa)",
    empresa: "Estilo Nordeste Ltda",
    competenciaInicial: "10/2025",
    competenciaFinal: "12/2025",
    faixaId: "fx1",
    vencimento: "25/11/2025",
    unificar: "Não",
    mensagem: "",
    valor: 600,
    status: "Pendente",
  },
  {
    id: "b2",
    tipo: "Contribuição Assistencial",
    empresa: "ModaSul S.A.",
    ano: "2025",
    periodicidade: "Mensal",
    parcelas: "3",
    vencimento: "30/11/2025",
    baseCalculo: 20000,
    percentual: 1.5,
    descontos: 0,
    valor: 300,
    status: "Emitida",
  },
];

type Faixa = {
  id: string;
  min: number;
  max: number;
  valor: number;
};

type MensalidadeForm = {
  competenciaInicial: string;
  competenciaFinal: string;
  vencimento: string;
  faixaId: string;
  unificar: "Sim" | "Não" | "";
  mensagem: string;
};

type ContribuicaoForm = {
  ano: string;
  periodicidade: string;
  parcelas: string;
  vencimento: string;
  baseCalculo: string;
  percentual: string;
  descontos: string;
};

type Boleto = {
  id: string;
  tipo: string;
  empresa: string;
  status: string;
  valor: number;
  vencimento: string;
  competenciaInicial?: string;
  competenciaFinal?: string;
  faixaId?: string;
  unificar?: string;
  mensagem?: string;
  ano?: string;
  periodicidade?: string;
  parcelas?: string;
  baseCalculo?: number;
  percentual?: number;
  descontos?: number;
};

type ContribuicaoHistorico = {
  id: string;
  ano: string;
  empresa: string;
  periodicidade: string;
  parcelas: string;
  base: number;
  percentual: number;
  descontos: number;
  valor: number;
  vencimento: string;
  situacao: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Financeiro = () => {
  const { toast } = useToast();
  const [faixas, setFaixas] = useState<Faixa[]>(initialFaixas);
  const [faixaDialogOpen, setFaixaDialogOpen] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState<Faixa | null>(null);
  const [faixaForm, setFaixaForm] = useState({ min: "", max: "", valor: "" });

  const [boletos, setBoletos] = useState<Boleto[]>(initialBoletos);
  const initialHistorico: ContribuicaoHistorico[] = useMemo(
    () =>
      initialBoletos
        .filter((boleto) => boleto.tipo === "Contribuição Assistencial")
        .map((boleto) => ({
          id: `hist-${boleto.id}`,
          ano: boleto.ano || "",
          empresa: boleto.empresa,
          periodicidade: boleto.periodicidade || "Mensal",
          parcelas: boleto.parcelas || "1",
          base: boleto.baseCalculo || 0,
          percentual: boleto.percentual || 0,
          descontos: boleto.descontos || 0,
          valor: boleto.valor,
          vencimento: boleto.vencimento,
          situacao: boleto.status,
        })),
    []
  );
  const [historicoContribuicao, setHistoricoContribuicao] = useState<ContribuicaoHistorico[]>(initialHistorico);

  const empresasDisponiveis = useMemo(() => {
    const empresas = new Set(boletos.map((boleto) => boleto.empresa));
    empresas.add("ModaSul Indústria e Comércio S.A.");
    empresas.add("Confecções Aurora");
    empresas.add("Costura Viva");
    return Array.from(empresas);
  }, [boletos]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState("");

  const [mensalidadeForm, setMensalidadeForm] = useState<MensalidadeForm>({
    competenciaInicial: "",
    competenciaFinal: "",
    vencimento: "",
    faixaId: "",
    unificar: "",
    mensagem: "",
  });
  const [mensalidadePesquisada, setMensalidadePesquisada] = useState(false);

  const [contribuicaoForm, setContribuicaoForm] = useState<ContribuicaoForm>({
    ano: "",
    periodicidade: "",
    parcelas: "",
    vencimento: "",
    baseCalculo: "",
    percentual: "",
    descontos: "",
  });
  const [contribuicaoPesquisada, setContribuicaoPesquisada] = useState(false);
  const [valorCalculado, setValorCalculado] = useState(0);

  const resetWizard = () => {
    setWizardStep(1);
    setTipoSelecionado("");
    setEmpresaSelecionada("");
    setMensalidadeForm({
      competenciaInicial: "",
      competenciaFinal: "",
      vencimento: "",
      faixaId: "",
      unificar: "",
      mensagem: "",
    });
    setMensalidadePesquisada(false);
    setContribuicaoForm({
      ano: "",
      periodicidade: "",
      parcelas: "",
      vencimento: "",
      baseCalculo: "",
      percentual: "",
      descontos: "",
    });
    setValorCalculado(0);
    setContribuicaoPesquisada(false);
  };

  const handleFaixaDialogChange = (open: boolean) => {
    setFaixaDialogOpen(open);
    if (!open) {
      setEditingFaixa(null);
      setFaixaForm({ min: "", max: "", valor: "" });
    }
  };

  const handleWizardOpenChange = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      resetWizard();
    }
  };

  const validarIntervalo = (min: number, max: number, id?: string) => {
    if (min > max) {
      toast({
        title: "Intervalo inválido",
        description: "O mínimo não pode ser maior que o máximo.",
        variant: "destructive",
      });
      return false;
    }

    const sobreposicao = faixas.some((faixa) => {
      if (faixa.id === id) return false;
      return Math.max(faixa.min, min) <= Math.min(faixa.max, max);
    });

    if (sobreposicao) {
      toast({
        title: "Sobreposição detectada",
        description: "A nova faixa conflita com outra faixa cadastrada.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSalvarFaixa = () => {
    const min = parseInt(faixaForm.min, 10);
    const max = parseInt(faixaForm.max, 10);
    const valor = parseFloat(faixaForm.valor);

    if (!min || !max || !valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha mínimo, máximo e valor.",
        variant: "destructive",
      });
      return;
    }

    if (!validarIntervalo(min, max, editingFaixa?.id)) return;

    if (editingFaixa) {
      setFaixas((prev) =>
        prev.map((faixa) => (faixa.id === editingFaixa.id ? { ...faixa, min, max, valor } : faixa))
      );
      toast({ title: "Faixa atualizada", description: "Os valores foram atualizados com sucesso." });
    } else {
      const novaFaixa: Faixa = { id: `fx-${Date.now()}`, min, max, valor };
      setFaixas((prev) => [...prev, novaFaixa].sort((a, b) => a.min - b.min));
      toast({ title: "Faixa criada", description: "A nova faixa foi adicionada ao sistema." });
    }

    handleFaixaDialogChange(false);
  };

  const handleEditarFaixa = (faixa: Faixa) => {
    setEditingFaixa(faixa);
    setFaixaForm({ min: faixa.min.toString(), max: faixa.max.toString(), valor: faixa.valor.toString() });
    setFaixaDialogOpen(true);
  };

  const handleExcluirFaixa = (id: string) => {
    setFaixas((prev) => prev.filter((faixa) => faixa.id !== id));
    toast({ title: "Faixa removida", description: "A faixa foi excluída." });
  };

  const handlePesquisarMensalidade = () => {
    const { competenciaInicial, competenciaFinal, vencimento, faixaId, unificar } = mensalidadeForm;
    if (!competenciaInicial || !competenciaFinal || !vencimento || !faixaId || !unificar) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todas as informações para continuar.",
        variant: "destructive",
      });
      return;
    }
    setMensalidadePesquisada(true);
    toast({ title: "Prévia pronta", description: "Valores calculados com base na faixa selecionada." });
  };

  const handleSalvarFiltroMensalidade = () => {
    toast({ title: "Filtro salvo", description: "Filtro armazenado (mock)." });
  };

  const handleLimparMensalidade = () => {
    setMensalidadeForm({
      competenciaInicial: "",
      competenciaFinal: "",
      vencimento: "",
      faixaId: "",
      unificar: "",
      mensagem: "",
    });
    setMensalidadePesquisada(false);
  };

  const calcularAliquota = () => {
    const base = parseFloat(contribuicaoForm.baseCalculo) || 0;
    const perc = parseFloat(contribuicaoForm.percentual) || 0;
    const desc = parseFloat(contribuicaoForm.descontos) || 0;
    const result = (base * perc) / 100 - desc;
    return result > 0 ? result : 0;
  };

  useEffect(() => {
    if (tipoSelecionado === "Contribuição Assistencial") {
      setValorCalculado(calcularAliquota());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contribuicaoForm.baseCalculo, contribuicaoForm.percentual, contribuicaoForm.descontos, tipoSelecionado]);

  const handlePesquisarContribuicao = () => {
    const { ano, periodicidade, parcelas, vencimento } = contribuicaoForm;
    if (!ano || !periodicidade || !parcelas || !vencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Complete todas as informações para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (valorCalculado <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe base, percentual e descontos para calcular um valor válido.",
        variant: "destructive",
      });
      return;
    }

    setContribuicaoPesquisada(true);
    toast({ title: "Prévia pronta", description: "Valor calculado e pronto para emissão." });
  };

  const handleLimparContribuicao = () => {
    setContribuicaoForm({
      ano: "",
      periodicidade: "",
      parcelas: "",
      vencimento: "",
      baseCalculo: "",
      percentual: "",
      descontos: "",
    });
    setValorCalculado(0);
    setContribuicaoPesquisada(false);
  };

  const handleCalcularAliquotaClick = () => {
    const calculado = calcularAliquota();
    setValorCalculado(calculado);
    toast({ title: "Valor atualizado", description: formatCurrency(calculado) });
  };

  const stepValido = () => {
    if (wizardStep === 1) {
      return tipoSelecionado !== "" && empresaSelecionada.trim() !== "";
    }
    if (wizardStep === 2) {
      if (tipoSelecionado === "Mensalidade (por Faixa)") {
        return mensalidadePesquisada;
      }
      if (tipoSelecionado === "Contribuição Assistencial") {
        return contribuicaoPesquisada;
      }
    }
    return true;
  };

  const avancar = () => {
    if (!stepValido()) {
      toast({
        title: "Complete as informações",
        description: "Finalize a etapa atual antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setWizardStep((prev) => Math.min(prev + 1, 3));
  };

  const voltar = () => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const faixaSelecionada = faixas.find((faixa) => faixa.id === mensalidadeForm.faixaId);

  const resumoBoleto = () => {
    if (tipoSelecionado === "Mensalidade (por Faixa)" && faixaSelecionada) {
      return {
        descricao: `Competências ${mensalidadeForm.competenciaInicial} até ${mensalidadeForm.competenciaFinal}`,
        valor: faixaSelecionada.valor,
        detalhes: [
          { rotulo: "Faixa", valor: `${faixaSelecionada.min}–${faixaSelecionada.max} • ${formatCurrency(faixaSelecionada.valor)}` },
          { rotulo: "Unificar Competências", valor: mensalidadeForm.unificar },
          { rotulo: "Mensagem", valor: mensalidadeForm.mensagem || "(sem mensagem)" },
        ],
      };
    }

    if (tipoSelecionado === "Contribuição Assistencial") {
      return {
        descricao: `Ano-base ${contribuicaoForm.ano}`,
        valor: valorCalculado,
        detalhes: [
          { rotulo: "Periodicidade", valor: contribuicaoForm.periodicidade },
          { rotulo: "Parcelas", valor: contribuicaoForm.parcelas },
          { rotulo: "Base de cálculo", valor: formatCurrency(parseFloat(contribuicaoForm.baseCalculo || "0")) },
          { rotulo: "Percentual", valor: `${contribuicaoForm.percentual || 0}%` },
          { rotulo: "Descontos", valor: formatCurrency(parseFloat(contribuicaoForm.descontos || "0")) },
        ],
      };
    }

    return null;
  };

  const handleEmitir = () => {
    const resumo = resumoBoleto();
    if (!resumo) return;

    const novoBoleto: Boleto = {
      id: `boleto-${Date.now()}`,
      tipo: tipoSelecionado,
      empresa: empresaSelecionada,
      status: "Emitida",
      valor: resumo.valor,
      vencimento:
        tipoSelecionado === "Mensalidade (por Faixa)"
          ? mensalidadeForm.vencimento
          : contribuicaoForm.vencimento,
      competenciaInicial: mensalidadeForm.competenciaInicial,
      competenciaFinal: mensalidadeForm.competenciaFinal,
      faixaId: mensalidadeForm.faixaId,
      unificar: mensalidadeForm.unificar,
      mensagem: mensalidadeForm.mensagem,
      ano: contribuicaoForm.ano,
      periodicidade: contribuicaoForm.periodicidade,
      parcelas: contribuicaoForm.parcelas,
      baseCalculo: parseFloat(contribuicaoForm.baseCalculo || "0"),
      percentual: parseFloat(contribuicaoForm.percentual || "0"),
      descontos: parseFloat(contribuicaoForm.descontos || "0"),
    };

    setBoletos((prev) => [novoBoleto, ...prev]);

    if (tipoSelecionado === "Contribuição Assistencial") {
      const historico: ContribuicaoHistorico = {
        id: `hist-${Date.now()}`,
        ano: contribuicaoForm.ano,
        empresa: empresaSelecionada,
        periodicidade: contribuicaoForm.periodicidade,
        parcelas: contribuicaoForm.parcelas,
        base: parseFloat(contribuicaoForm.baseCalculo || "0"),
        percentual: parseFloat(contribuicaoForm.percentual || "0"),
        descontos: parseFloat(contribuicaoForm.descontos || "0"),
        valor: valorCalculado,
        vencimento: contribuicaoForm.vencimento,
        situacao: "Emitida",
      };
      setHistoricoContribuicao((prev) => [historico, ...prev]);
    }

    toast({ title: "Boleto emitido", description: "O boleto foi salvo e aparecerá na lista." });
    handleWizardOpenChange(false);
  };

  const steps = [
    { id: 1, titulo: "Tipo do Boleto" },
    { id: 2, titulo: "Detalhes" },
    { id: 3, titulo: "Revisão e Emissão" },
  ];

  const renderStepHeader = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step) => (
          <div key={step.id} className="flex-1 text-center">
            <div
              className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold ${
                wizardStep === step.id
                  ? "border-[#1C1C1C] text-[#1C1C1C]"
                  : wizardStep > step.id
                    ? "border-[#7E8C5E] text-[#7E8C5E]"
                    : "border-muted text-muted-foreground"
              }`}
            >
              {wizardStep > step.id ? <CheckCircle2 className="h-5 w-5 text-[#7E8C5E]" /> : step.id}
            </div>
            <p className="mt-2 text-sm font-medium">{step.titulo}</p>
          </div>
        ))}
      </div>
      <Progress value={(wizardStep / steps.length) * 100} className="h-2 bg-[#F7F8F4]" />
    </div>
  );

  const renderStepContent = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold">Tipo</Label>
              <RadioGroup
                value={tipoSelecionado}
                onValueChange={(value) => {
                  setTipoSelecionado(value);
                  setMensalidadePesquisada(false);
                  setContribuicaoPesquisada(false);
                }}
                className="mt-3 grid gap-3 md:grid-cols-2"
              >
                <Label
                  htmlFor="mensalidade"
                  className={`rounded-lg border px-4 py-3 cursor-pointer ${
                    tipoSelecionado === "Mensalidade (por Faixa)" ? "border-[#1C1C1C] bg-[#F7F8F4]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Mensalidade (por Faixa)" id="mensalidade" />
                    <div>
                      <p className="font-semibold">Mensalidade (por Faixa)</p>
                      <p className="text-sm text-muted-foreground">Baseada nas faixas cadastradas</p>
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="contribuicao"
                  className={`rounded-lg border px-4 py-3 cursor-pointer ${
                    tipoSelecionado === "Contribuição Assistencial" ? "border-[#1C1C1C] bg-[#F7F8F4]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Contribuição Assistencial" id="contribuicao" />
                    <div>
                      <p className="font-semibold">Contribuição Assistencial</p>
                      <p className="text-sm text-muted-foreground">Inclui calculadora de alíquota</p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                aria-label="Empresa"
                placeholder="Busque por nome ou CNPJ"
                list="empresas"
                value={empresaSelecionada}
                onChange={(event) => setEmpresaSelecionada(event.target.value)}
              />
              <datalist id="empresas">
                {empresasDisponiveis.map((empresa) => (
                  <option value={empresa} key={empresa} />
                ))}
              </datalist>
            </div>
          </div>
        );
      case 2:
        return tipoSelecionado === "Mensalidade (por Faixa)" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="competenciaInicial">Competência Inicial *</Label>
                <Input
                  id="competenciaInicial"
                  aria-label="Competência Inicial"
                  placeholder="mm/aaaa"
                  value={mensalidadeForm.competenciaInicial}
                  onChange={(event) =>
                    setMensalidadeForm((prev) => ({ ...prev, competenciaInicial: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="competenciaFinal">Competência Final *</Label>
                <Input
                  id="competenciaFinal"
                  aria-label="Competência Final"
                  placeholder="mm/aaaa"
                  value={mensalidadeForm.competenciaFinal}
                  onChange={(event) =>
                    setMensalidadeForm((prev) => ({ ...prev, competenciaFinal: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="dataVencimento">Data Vencimento *</Label>
                <Input
                  id="dataVencimento"
                  aria-label="Data de Vencimento"
                  placeholder="dd/mm/aaaa"
                  value={mensalidadeForm.vencimento}
                  onChange={(event) => setMensalidadeForm((prev) => ({ ...prev, vencimento: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="faixa">Faixa *</Label>
                <Select
                  value={mensalidadeForm.faixaId}
                  onValueChange={(value) => setMensalidadeForm((prev) => ({ ...prev, faixaId: value }))}
                >
                  <SelectTrigger id="faixa" aria-label="Faixa" className="bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {faixas.map((faixa) => (
                      <SelectItem key={faixa.id} value={faixa.id}>
                        {`${faixa.min}–${faixa.max} • ${formatCurrency(faixa.valor)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unificar">Unificar Competências *</Label>
                <Select
                  value={mensalidadeForm.unificar}
                  onValueChange={(value: "Sim" | "Não") => setMensalidadeForm((prev) => ({ ...prev, unificar: value }))}
                >
                  <SelectTrigger id="unificar" aria-label="Unificar Competências" className="bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mensagem">Mensagem Personalizada</Label>
                <Textarea
                  id="mensagem"
                  aria-label="Mensagem Personalizada"
                  placeholder="Adicione uma mensagem para o boleto"
                  value={mensalidadeForm.mensagem}
                  onChange={(event) => setMensalidadeForm((prev) => ({ ...prev, mensagem: event.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button className="bg-[#00A86B] hover:bg-[#028454]" onClick={handlePesquisarMensalidade}>
                Pesquisar
              </Button>
              <Button variant="outline" onClick={handleLimparMensalidade}>
                Limpar
              </Button>
              <Button variant="secondary" className="bg-[#1C1C1C] text-white hover:bg-[#2c2c2c]" onClick={handleSalvarFiltroMensalidade}>
                Salvar Filtro
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ano">Ano da Contribuição *</Label>
                <Input
                  id="ano"
                  aria-label="Ano da Contribuição"
                  placeholder="aaaa"
                  value={contribuicaoForm.ano}
                  onChange={(event) => setContribuicaoForm((prev) => ({ ...prev, ano: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="periodicidade">Periodicidade do Boleto *</Label>
                <Select
                  value={contribuicaoForm.periodicidade}
                  onValueChange={(value) => setContribuicaoForm((prev) => ({ ...prev, periodicidade: value }))}
                >
                  <SelectTrigger id="periodicidade" aria-label="Periodicidade" className="bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parcelas">Qtde. Parcelas *</Label>
                <Select
                  value={contribuicaoForm.parcelas}
                  onValueChange={(value) => setContribuicaoForm((prev) => ({ ...prev, parcelas: value }))}
                >
                  <SelectTrigger id="parcelas" aria-label="Quantidade de Parcelas" className="bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 12].map((numero) => (
                      <SelectItem key={numero} value={numero.toString()}>
                        {numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vencimentoContrib">Data Vencimento *</Label>
                <Input
                  id="vencimentoContrib"
                  aria-label="Data de Vencimento"
                  placeholder="dd/mm/aaaa"
                  value={contribuicaoForm.vencimento}
                  onChange={(event) => setContribuicaoForm((prev) => ({ ...prev, vencimento: event.target.value }))}
                />
              </div>
            </div>

            <Card className="bg-[#F7F8F4] border-[#DCE7CB]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-4 w-4" /> Calculadora de Alíquota
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="baseCalculo">Base de Cálculo (R$) *</Label>
                  <Input
                    id="baseCalculo"
                    aria-label="Base de Cálculo"
                    type="number"
                    placeholder="20000"
                    value={contribuicaoForm.baseCalculo}
                    onChange={(event) => setContribuicaoForm((prev) => ({ ...prev, baseCalculo: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="percentual">Percentual (%) *</Label>
                  <Input
                    id="percentual"
                    aria-label="Percentual"
                    type="number"
                    placeholder="1.5"
                    value={contribuicaoForm.percentual}
                    onChange={(event) => setContribuicaoForm((prev) => ({ ...prev, percentual: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="descontos">Descontos/Isenções (R$)</Label>
                  <Input
                    id="descontos"
                    aria-label="Descontos"
                    type="number"
                    placeholder="0"
                    value={contribuicaoForm.descontos}
                    onChange={(event) => setContribuicaoForm((prev) => ({ ...prev, descontos: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Valor Calculado (R$)</Label>
                  <Input readOnly value={formatCurrency(valorCalculado)} className="font-semibold" aria-label="Valor Calculado" />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    className="bg-[#00A86B] hover:bg-[#028454]"
                    onClick={handleCalcularAliquotaClick}
                  >
                    Calcular
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button className="bg-[#00A86B] hover:bg-[#028454]" onClick={handlePesquisarContribuicao}>
                Pesquisar
              </Button>
              <Button variant="outline" onClick={handleLimparContribuicao}>
                Limpar
              </Button>
            </div>
          </div>
        );
      case 3:
        const resumo = resumoBoleto();
        return resumo ? (
          <div className="space-y-4">
            <Card className="bg-[#F7F8F4]">
              <CardHeader>
                <CardTitle className="text-lg">Resumo do boleto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Empresa</p>
                    <p className="font-semibold">{empresaSelecionada}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-semibold">{tipoSelecionado}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencimento</p>
                    <p className="font-semibold">
                      {tipoSelecionado === "Mensalidade (por Faixa)" ? mensalidadeForm.vencimento : contribuicaoForm.vencimento}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Descrição</p>
                    <p className="font-semibold">{resumo.descricao}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Valor total</span>
                    <span className="text-xl font-bold text-[#1C1C1C]">{formatCurrency(resumo.valor)}</span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {resumo.detalhes.map((item) => (
                      <div key={item.rotulo} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.rotulo}</span>
                        <span className="font-medium text-right ml-3">{item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const renderWizardFooter = () => (
    <DialogFooter className="flex justify-between gap-3 sm:flex-row">
      <div className="flex gap-3">
        {wizardStep > 1 && (
          <Button type="button" variant="outline" onClick={voltar}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        )}
        {wizardStep < 3 ? (
          <Button type="button" className="bg-[#1C1C1C] text-white" onClick={avancar}>
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="bg-[#00A86B] hover:bg-[#028454] text-white" onClick={handleEmitir}>
            Emitir
          </Button>
        )}
      </div>
      <Button type="button" variant="ghost" onClick={() => handleWizardOpenChange(false)}>
        Cancelar
      </Button>
    </DialogFooter>
  );

  const renderFaixas = () => (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold">Faixas de Mensalidade</CardTitle>
          <p className="text-sm text-muted-foreground">Cadastre e ajuste as faixas utilizadas no cálculo das mensalidades.</p>
        </div>
        <Button onClick={() => setFaixaDialogOpen(true)} className="bg-[#1C1C1C] text-white hover:bg-black">
          <Plus className="mr-2 h-4 w-4" /> Nova Faixa
        </Button>
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
              {faixas.map((faixa) => (
                <TableRow key={faixa.id}>
                  <TableCell>{faixa.min}</TableCell>
                  <TableCell>{faixa.max}</TableCell>
                  <TableCell>{formatCurrency(faixa.valor)}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditarFaixa(faixa)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleExcluirFaixa(faixa.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderBoletos = () => (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold">Boletos</CardTitle>
          <p className="text-sm text-muted-foreground">Emita boletos usando o modal multi-etapas.</p>
        </div>
        <Button className="bg-[#1C1C1C] text-white hover:bg-black" onClick={() => setWizardOpen(true)}>
          + Criar boleto
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boletos.map((boleto) => (
                <TableRow key={boleto.id}>
                  <TableCell className="font-medium">{boleto.empresa}</TableCell>
                  <TableCell>{boleto.tipo}</TableCell>
                  <TableCell>{formatCurrency(boleto.valor)}</TableCell>
                  <TableCell>{boleto.vencimento}</TableCell>
                  <TableCell>
                    <Badge className={boleto.status === "Emitida" ? "bg-[#DCE7CB] text-[#1C1C1C]" : ""}>{boleto.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderHistorico = () => (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold">Histórico de Contribuição Assistencial</CardTitle>
          <p className="text-sm text-muted-foreground">Registros derivados dos boletos emitidos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Exportação", description: "CSV gerado (mock)." })}>
            <FileText className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Exportação", description: "PDF gerado (mock)." })}>
            <FileDown className="mr-2 h-4 w-4" /> PDF
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
              {historicoContribuicao.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell>{registro.ano}</TableCell>
                  <TableCell className="font-medium">{registro.empresa}</TableCell>
                  <TableCell>{registro.periodicidade}</TableCell>
                  <TableCell>{registro.parcelas}</TableCell>
                  <TableCell>{formatCurrency(registro.base)}</TableCell>
                  <TableCell>{registro.percentual}%</TableCell>
                  <TableCell>{formatCurrency(registro.descontos)}</TableCell>
                  <TableCell>{formatCurrency(registro.valor)}</TableCell>
                  <TableCell>{registro.vencimento}</TableCell>
                  <TableCell>
                    <Badge className={registro.situacao === "Emitida" ? "bg-[#DCE7CB] text-[#1C1C1C]" : ""}>
                      {registro.situacao}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F7F8F4]">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">Financeiro</h1>
              <p className="text-muted-foreground">Financeiro atualizado: wizard de boletos + calculadora de % em contribuição.</p>
            </div>

            <Tabs defaultValue="boletos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white">
                <TabsTrigger value="faixas">Faixas</TabsTrigger>
                <TabsTrigger value="boletos">Boletos</TabsTrigger>
                <TabsTrigger value="contribuicao">Contribuição</TabsTrigger>
              </TabsList>
              <TabsContent value="faixas" className="mt-6">{renderFaixas()}</TabsContent>
              <TabsContent value="boletos" className="mt-6">{renderBoletos()}</TabsContent>
              <TabsContent value="contribuicao" className="mt-6">{renderHistorico()}</TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <Dialog open={faixaDialogOpen} onOpenChange={handleFaixaDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaixa ? "Editar faixa" : "Nova faixa"}</DialogTitle>
            <DialogDescription>Informe o intervalo de funcionários e o valor correspondente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="minFuncionarios">Mín Funcionários</Label>
              <Input
                id="minFuncionarios"
                aria-label="Mínimo de funcionários"
                type="number"
                value={faixaForm.min}
                onChange={(event) => setFaixaForm((prev) => ({ ...prev, min: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="maxFuncionarios">Máx Funcionários</Label>
              <Input
                id="maxFuncionarios"
                aria-label="Máximo de funcionários"
                type="number"
                value={faixaForm.max}
                onChange={(event) => setFaixaForm((prev) => ({ ...prev, max: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="valorFaixa">Valor (R$)</Label>
              <Input
                id="valorFaixa"
                aria-label="Valor da faixa"
                type="number"
                value={faixaForm.valor}
                onChange={(event) => setFaixaForm((prev) => ({ ...prev, valor: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleFaixaDialogChange(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#1C1C1C] text-white hover:bg-black" onClick={handleSalvarFaixa}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wizardOpen} onOpenChange={handleWizardOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>+ Criar boleto</DialogTitle>
            <DialogDescription>Preencha todas as etapas para emitir um boleto.</DialogDescription>
          </DialogHeader>
          {renderStepHeader()}
          <div className="mt-6 space-y-6">{renderStepContent()}</div>
          {renderWizardFooter()}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Financeiro;
