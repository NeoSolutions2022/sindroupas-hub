import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { FileDown, Eye, Calculator, Plus, Edit, Trash2, Search, Save, RotateCcw, Building2, MessageCircle, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BoletoRegistro, HistoricoContribuicao } from "@/lib/financeiro-data";
import { AdvancedFilters, FilterState, defaultFilters } from "@/components/financeiro/AdvancedFilters";
import { GerarNovoBoletoModal } from "@/components/financeiro/GerarNovoBoletoModal";
import { BoletoActionsCell } from "@/components/financeiro/BoletoActionsCell";
import { format, parse, isBefore, isAfter, differenceInDays } from "date-fns";
import { hasuraRequest } from "@/lib/api/hasura";
import { useAuth } from "@/contexts/AuthContext";

type EmpresaLookupRow = {
  id: string;
  razao_social: string;
  cnpj?: string | null;
  responsaveis?: { id: string; nome?: string | null; whatsapp?: string | null; email?: string | null }[];
  colaboradores?: { id: string; nome?: string | null; whatsapp?: string | null; email?: string | null }[];
};

type BoletoRow = {
  id: string;
  tipo?: string | null;
  valor?: number | null;
  vencimento?: string | null;
  status?: string | null;
  competencia_inicial?: string | null;
  competencia_final?: string | null;
  faixa?: string | null;
  ano?: string | null;
  periodicidade?: string | null;
  parcelas?: number | null;
  base?: number | null;
  percentual?: number | null;
  descontos?: number | null;
  empresa?: { id: string; razao_social: string } | null;
};

type ContribuicaoRow = {
  id: string;
  ano?: string | null;
  periodicidade?: string | null;
  parcelas?: number | null;
  base?: number | null;
  percentual?: number | null;
  descontos?: number | null;
  valor?: number | null;
  vencimento?: string | null;
  situacao?: string | null;
  empresa?: { id: string; razao_social: string } | null;
};

type FaixaRow = {
  id: string;
  label?: string | null;
  min_colaboradores?: number | null;
  max_colaboradores?: number | null;
  valor_mensalidade?: number | null;
};

const FINANCEIRO_QUERY = `
  query FinanceiroPage {
    financeiro_boletos(order_by: { vencimento: desc }) {
      id
      tipo
      valor
      vencimento
      status
      competencia_inicial
      competencia_final
      faixa
      ano
      periodicidade
      parcelas
      base
      percentual
      descontos
      empresa {
        id
        razao_social
      }
    }
    contribuicoes_assistenciais(order_by: { vencimento: desc }) {
      id
      ano
      periodicidade
      parcelas
      base
      percentual
      descontos
      valor
      vencimento
      situacao
      empresa {
        id
        razao_social
      }
    }
    empresas(order_by: { razao_social: asc }) {
      id
      razao_social
      cnpj
      responsaveis {
        id
        nome
        whatsapp
        email
      }
      colaboradores {
        id
        nome
        whatsapp
        email
      }
    }
    faixas(order_by: { min_colaboradores: asc }) {
      id
      label
      min_colaboradores
      max_colaboradores
      valor_mensalidade
    }
  }
`;

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
  anoContribuicao: string;
  periodicidade: string;
  parcelas: string;
  baseCalculo: string;
  percentual: string;
  descontos: string;
  valorCalculado: number;
  pesquisaContribuicaoFeita: boolean;
}

const Financeiro = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);

  // Gerar Novo Boleto modal
  const [gerarNovoOpen, setGerarNovoOpen] = useState(false);
  const [selectedBoletoForNew, setSelectedBoletoForNew] = useState<{
    id: string;
    empresa: string;
    vencimento: string;
    valor: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["financeiro-page"],
    queryFn: () =>
      hasuraRequest<{
        financeiro_boletos: BoletoRow[];
        contribuicoes_assistenciais: ContribuicaoRow[];
        empresas: EmpresaLookupRow[];
        faixas: FaixaRow[];
      }>({
        query: FINANCEIRO_QUERY,
        token,
      }),
  });

  const boletos = useMemo<BoletoRegistro[]>(() => {
    return (
      data?.financeiro_boletos.map((boleto) => ({
        id: boleto.id,
        tipo: (boleto.tipo as BoletoRegistro["tipo"]) ?? "Mensalidade (por Faixa)",
        empresa: boleto.empresa?.razao_social ?? "Empresa não informada",
        valor: boleto.valor ?? 0,
        vencimento: boleto.vencimento ?? "",
        status: boleto.status ?? "Pendente",
        competenciaInicial: boleto.competencia_inicial ?? undefined,
        competenciaFinal: boleto.competencia_final ?? undefined,
        faixa: boleto.faixa ?? undefined,
        ano: boleto.ano ?? undefined,
        periodicidade: boleto.periodicidade ?? undefined,
        parcelas: boleto.parcelas ?? undefined,
        base: boleto.base ?? undefined,
        percentual: boleto.percentual ?? undefined,
        descontos: boleto.descontos ?? undefined,
      })) ?? []
    );
  }, [data?.financeiro_boletos]);

  const historicoContribuicao = useMemo<HistoricoContribuicao[]>(() => {
    return (
      data?.contribuicoes_assistenciais.map((item) => ({
        id: item.id,
        ano: item.ano ?? "",
        empresa: item.empresa?.razao_social ?? "Empresa não informada",
        periodicidade: item.periodicidade ?? "",
        parcelas: item.parcelas ?? 0,
        base: item.base ?? 0,
        percentual: item.percentual ?? 0,
        descontos: item.descontos ?? 0,
        valor: item.valor ?? 0,
        vencimento: item.vencimento ?? "",
        situacao: item.situacao ?? "Emitida",
      })) ?? []
    );
  }, [data?.contribuicoes_assistenciais]);

  const mockEmpresas = useMemo(
    () =>
      data?.empresas.map((empresa) => {
        const responsavel = empresa.responsaveis?.[0];
        const colaborador = empresa.colaboradores?.[0];
        const contato = responsavel ?? colaborador;
        return {
          id: empresa.id,
          nome: empresa.razao_social,
          cnpj: empresa.cnpj ?? "",
          contatoPrincipal: {
            nome: contato?.nome ?? "",
            whatsapp: contato?.whatsapp ?? "",
            email: contato?.email ?? "",
          },
        };
      }) ?? [],
    [data?.empresas],
  );

  const createBoletoMutation = useMutation({
    mutationFn: async (payload: BoletoForm) => {
      await hasuraRequest({
        query: `
          mutation InsertBoleto($input: financeiro_boletos_insert_input!) {
            insert_financeiro_boletos_one(object: $input) { id }
          }
        `,
        variables: {
          input: {
            empresa_id: payload.empresaId || null,
            tipo: payload.tipo === "contribuicao" ? "Contribuição Assistencial" : "Mensalidade (por Faixa)",
            competencia_inicial: payload.competenciaInicial || null,
            competencia_final: payload.competenciaFinal || null,
            vencimento: payload.dataVencimento || null,
            faixa: payload.faixaId || null,
            valor: payload.valorCalculado || null,
            status: "Pendente",
            ano: payload.anoContribuicao || null,
            periodicidade: payload.periodicidade || null,
            parcelas: payload.parcelas ? Number(payload.parcelas) : null,
            base: payload.baseCalculo ? Number(payload.baseCalculo) : null,
            percentual: payload.percentual ? Number(payload.percentual) : null,
            descontos: payload.descontos ? Number(payload.descontos) : null,
          },
        },
        token,
      });

      if (payload.tipo === "contribuicao") {
        await hasuraRequest({
          query: `
            mutation InsertContribuicao($input: contribuicoes_assistenciais_insert_input!) {
              insert_contribuicoes_assistenciais_one(object: $input) { id }
            }
          `,
          variables: {
            input: {
              empresa_id: payload.empresaId || null,
              ano: payload.anoContribuicao || null,
              periodicidade: payload.periodicidade || null,
              parcelas: payload.parcelas ? Number(payload.parcelas) : null,
              base: payload.baseCalculo ? Number(payload.baseCalculo) : null,
              percentual: payload.percentual ? Number(payload.percentual) : null,
              descontos: payload.descontos ? Number(payload.descontos) : null,
              valor: payload.valorCalculado || null,
              vencimento: payload.dataVencimento || null,
              situacao: "Emitida",
            },
          },
          token,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
    },
  });

  const faixas = useMemo<Faixa[]>(() => {
    return (
      data?.faixas.map((faixa) => ({
        id: faixa.id,
        min: faixa.min_colaboradores ?? 0,
        max: faixa.max_colaboradores ?? 0,
        valor: faixa.valor_mensalidade ?? 0,
      })) ?? []
    );
  }, [data?.faixas]);

  const saveFaixaMutation = useMutation({
    mutationFn: async (payload: { id?: string; min: number; max: number; valor: number }) => {
      if (payload.id) {
        await hasuraRequest({
          query: `
            mutation UpdateFaixa($id: uuid!, $input: faixas_set_input!) {
              update_faixas_by_pk(pk_columns: { id: $id }, _set: $input) { id }
            }
          `,
          variables: {
            id: payload.id,
            input: {
              min_colaboradores: payload.min,
              max_colaboradores: payload.max,
              valor_mensalidade: payload.valor,
            },
          },
          token,
        });
        return payload.id;
      }

      const created = await hasuraRequest<{ insert_faixas_one: { id: string } }>({
        query: `
          mutation InsertFaixa($input: faixas_insert_input!) {
            insert_faixas_one(object: $input) { id }
          }
        `,
        variables: {
          input: {
            min_colaboradores: payload.min,
            max_colaboradores: payload.max,
            valor_mensalidade: payload.valor,
          },
        },
        token,
      });

      return created.insert_faixas_one.id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
    },
  });

  const deleteFaixaMutation = useMutation({
    mutationFn: async (faixaId: string) => {
      await hasuraRequest({
        query: `
          mutation DeleteFaixa($id: uuid!) {
            delete_faixas_by_pk(id: $id) { id }
          }
        `,
        variables: { id: faixaId },
        token,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
    },
  });

  // Estado para Faixas
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
    anoContribuicao: "",
    periodicidade: "",
    parcelas: "",
    baseCalculo: "",
    percentual: "",
    descontos: "",
    valorCalculado: 0,
    pesquisaContribuicaoFeita: false,
  });
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false);
  const [previaBoleto, setPreviaBoleto] = useState<number | null>(null);
  const [contribuicaoPreview, setContribuicaoPreview] = useState("");

  useEffect(() => {
    if (searchParams.get("wizard") === "novo-boleto") {
      setWizardOpen(true);
      setWizardStep(1);
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete("wizard");
      setSearchParams(updatedParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Helper to parse date from dd/mm/yyyy
  const parseVencimento = (dateStr: string): Date | null => {
    try {
      return parse(dateStr, "dd/MM/yyyy", new Date());
    } catch {
      return null;
    }
  };

  // Determine boleto effective status (Vencido = due date < today AND not paid)
  const getBoletoEffectiveStatus = (boleto: BoletoRegistro): string => {
    if (boleto.status === "Pago") return "Pago";
    const dueDate = parseVencimento(boleto.vencimento);
    if (dueDate && isBefore(dueDate, new Date())) {
      return "Vencido";
    }
    return boleto.status;
  };

  const filteredBoletos = useMemo(() => {
    return boletos
      .filter((boleto) => {
        const f = appliedFilters;

        // Empresa filter
        if (f.empresaSearch && !boleto.empresa.toLowerCase().includes(f.empresaSearch.toLowerCase())) {
          return false;
        }

        // Status filter
        if (f.status.length > 0) {
          const effectiveStatus = getBoletoEffectiveStatus(boleto);
          if (!f.status.includes(effectiveStatus)) {
            return false;
          }
        }

        // Tipo filter
        if (f.tipo && f.tipo !== "todos" && boleto.tipo !== f.tipo) {
          return false;
        }

        // Date range filter
        const dueDate = parseVencimento(boleto.vencimento);
        if (dueDate) {
          if (f.dataInicio && isBefore(dueDate, f.dataInicio)) {
            return false;
          }
          if (f.dataFim && isAfter(dueDate, f.dataFim)) {
            return false;
          }
        }

        // Somente inadimplentes
        if (f.somenteInadimplentes) {
          const effectiveStatus = getBoletoEffectiveStatus(boleto);
          if (effectiveStatus !== "Atrasado" && effectiveStatus !== "Vencido") {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const f = appliedFilters;
        if (f.ordenacao === "valor") {
          return b.valor - a.valor;
        }
        if (f.ordenacao === "atrasados") {
          const dueDateA = parseVencimento(a.vencimento);
          const dueDateB = parseVencimento(b.vencimento);
          const daysA = dueDateA ? differenceInDays(new Date(), dueDateA) : 0;
          const daysB = dueDateB ? differenceInDays(new Date(), dueDateB) : 0;
          return daysB - daysA;
        }
        // Default: most recent first
        const dueDateA = parseVencimento(a.vencimento);
        const dueDateB = parseVencimento(b.vencimento);
        if (dueDateA && dueDateB) {
          return dueDateB.getTime() - dueDateA.getTime();
        }
        return 0;
      });
  }, [boletos, appliedFilters]);

  const ultimasContribuicoes = useMemo(() => {
    return [...historicoContribuicao].slice(-5).reverse();
  }, [historicoContribuicao]);

  const canProceed = useMemo(() => {
    if (wizardStep === 1) {
      return !!(boletoForm.tipo && boletoForm.empresaId);
    }

    if (wizardStep === 2) {
      if (boletoForm.tipo === "mensalidade") {
        return previaBoleto !== null;
      }

      return boletoForm.pesquisaContribuicaoFeita && boletoForm.valorCalculado > 0;
    }

    return true;
  }, [boletoForm, previaBoleto, wizardStep]);

  const handleExport = (formato: "PDF" | "Excel" | "CSV") => {
    if (formato === "Excel") {
      // Mock export with filtered data
      const exportData = filteredBoletos.map((b) => ({
        empresa: b.empresa,
        tipo: b.tipo,
        valor: b.valor,
        vencimento: b.vencimento,
        status: getBoletoEffectiveStatus(b),
      }));
      console.log("Exportando Excel com dados filtrados:", exportData);
      toast({
        title: "Exportação Excel iniciada",
        description: `Exportando ${filteredBoletos.length} boleto(s) filtrado(s).`,
      });
    } else {
      toast({
        title: "Exportação iniciada",
        description: `Relatório será exportado em ${formato}`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case "Atrasado":
        return <Badge variant="destructive">Atrasado</Badge>;
      case "Vencido":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Vencido</Badge>;
      case "Emitida":
      case "Pendente":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

    saveFaixaMutation.mutate(
      { id: faixaToEdit?.id, min, max, valor },
      {
        onSuccess: () => {
          toast({
            title: faixaToEdit ? "Faixa atualizada" : "Faixa criada",
            description: faixaToEdit
              ? "A faixa foi atualizada com sucesso."
              : "A nova faixa foi criada com sucesso.",
          });
          setFaixaDialogOpen(false);
          setFaixaForm({ min: "", max: "", valor: "" });
          setFaixaToEdit(null);
        },
        onError: (err) => {
          toast({
            title: "Falha ao salvar faixa",
            description: err instanceof Error ? err.message : "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDeleteFaixa = (faixa: Faixa) => {
    deleteFaixaMutation.mutate(faixa.id, {
      onSuccess: () => {
        setFaixaToDelete(null);
        toast({
          title: "Faixa excluída",
          description: "A faixa foi excluída com sucesso.",
        });
      },
      onError: (err) => {
        toast({
          title: "Falha ao excluir faixa",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      },
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
      anoContribuicao: "",
      periodicidade: "",
      parcelas: "",
      baseCalculo: "",
      percentual: "",
      descontos: "",
      valorCalculado: 0,
      pesquisaContribuicaoFeita: false,
    });
    setEmpresaSearch("");
    setPreviaBoleto(null);
    setContribuicaoPreview("");
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

  const parseCurrencyInput = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  const calcularValorContribuicao = () => {
    const base = parseCurrencyInput(boletoForm.baseCalculo);
    const perc = parseFloat(boletoForm.percentual.replace(",", ".") || "0");
    const desc = parseCurrencyInput(boletoForm.descontos);
    const resultado = Math.max((base * perc) / 100 - desc, 0);
    setBoletoForm((prev) => ({ ...prev, valorCalculado: resultado }));
    return resultado;
  };

  useEffect(() => {
    if (boletoForm.tipo === "contribuicao") {
      calcularValorContribuicao();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletoForm.baseCalculo, boletoForm.percentual, boletoForm.descontos, boletoForm.tipo]);

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!boletoForm.tipo || !boletoForm.empresaId) {
        toast({
          title: "Campos obrigatórios",
          description: "Selecione o tipo de boleto e uma empresa.",
          variant: "destructive",
        });
        return;
      }
    } else if (wizardStep === 2) {
      if (boletoForm.tipo === "mensalidade") {
        if (previaBoleto === null) {
          toast({
            title: "Pesquisa obrigatória",
            description: "Clique em 'Pesquisar' antes de avançar.",
            variant: "destructive",
          });
          return;
        }
      } else {
        const parcelasNumber = parseInt(boletoForm.parcelas, 10);
        const camposObrigatorios =
          boletoForm.anoContribuicao.length === 4 &&
          boletoForm.periodicidade &&
          boletoForm.parcelas &&
          !Number.isNaN(parcelasNumber) &&
          boletoForm.dataVencimento &&
          boletoForm.percentual &&
          boletoForm.baseCalculo;

        if (!camposObrigatorios || !boletoForm.pesquisaContribuicaoFeita) {
          toast({
            title: "Campos obrigatórios",
            description: "Pesquise e valide os dados antes de avançar.",
            variant: "destructive",
          });
          return;
        }

        if (boletoForm.valorCalculado <= 0) {
          toast({
            title: "Valor obrigatório",
            description: "O valor calculado deve ser maior que zero.",
            variant: "destructive",
          });
          return;
        }
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

  const handlePesquisarContribuicao = () => {
    const parcelasNumber = parseInt(boletoForm.parcelas, 10);
    const camposValidos =
      boletoForm.anoContribuicao.length === 4 &&
      boletoForm.periodicidade &&
      boletoForm.parcelas &&
      !Number.isNaN(parcelasNumber) &&
      boletoForm.dataVencimento &&
      boletoForm.percentual &&
      boletoForm.baseCalculo;

    if (!camposValidos) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para calcular.",
        variant: "destructive",
      });
      return;
    }

    const valor = calcularValorContribuicao();
    const baseValor = parseCurrencyInput(boletoForm.baseCalculo);
    const descontoValor = parseCurrencyInput(boletoForm.descontos);
    const descontoTexto =
      descontoValor > 0
        ? `, com descontos de R$ ${descontoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : ", sem descontos";

    setContribuicaoPreview(
      `Prévia: Contribuição Assistencial de R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${boletoForm.percentual}% sobre R$ ${baseValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${descontoTexto}).`
    );
    setBoletoForm((prev) => ({ ...prev, pesquisaContribuicaoFeita: true }));

    toast({
      title: "Pesquisa concluída",
      description: "Prévia calculada com sucesso.",
    });
  };

  const handleLimparContribuicao = () => {
    setBoletoForm((prev) => ({
      ...prev,
      anoContribuicao: "",
      periodicidade: "",
      parcelas: "",
      dataVencimento: "",
      baseCalculo: "",
      percentual: "",
      descontos: "",
      valorCalculado: 0,
      pesquisaContribuicaoFeita: false,
    }));
    setContribuicaoPreview("");
  };

  const handleEmitirBoleto = () => {
    createBoletoMutation.mutate(boletoForm, {
      onSuccess: () => {
        toast({
          title:
            boletoForm.tipo === "contribuicao"
              ? "Boleto de Contribuição Assistencial emitido com sucesso"
              : "Boleto emitido com sucesso",
          description: `Boleto para ${boletoForm.empresaNome} criado.`,
        });
        resetWizard();
      },
      onError: (err) => {
        toast({
          title: "Falha ao emitir boleto",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full space-y-5">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">Financeiro</h1>
                  <p className="text-sm text-muted-foreground">Gestão de boletos, faixas e contribuições</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleExport("PDF")}>
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleExport("Excel")}>
                    <FileDown className="h-3.5 w-3.5" />
                    Excel
                  </Button>
                </div>
              </div>

              {isLoading && (
                <div className="rounded-xl border border-dashed border-muted p-4 text-sm text-muted-foreground">
                  Carregando dados financeiros do Hasura...
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  {error instanceof Error ? error.message : "Erro ao carregar dados financeiros."}
                </div>
              )}

              <Tabs defaultValue="boletos" className="w-full">
                <TabsList className="h-10 p-1 bg-muted/50 rounded-lg w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
                  <TabsTrigger value="boletos" className="text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Boletos
                  </TabsTrigger>
                  <TabsTrigger value="faixas" className="text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Faixas
                  </TabsTrigger>
                  <TabsTrigger value="contribuicao" className="text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Contribuição
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="boletos">
                {/* Advanced Filters */}
                <AdvancedFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onFilter={() => setAppliedFilters({ ...filters })}
                  onClear={() => {
                    setFilters(defaultFilters);
                    setAppliedFilters(defaultFilters);
                  }}
                  empresas={mockEmpresas.map((e) => ({ id: e.id, nome: e.nome }))}
                />

                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle>Controle de Boletos</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {filteredBoletos.length} boleto(s) encontrado(s)
                        </p>
                      </div>
                      <Button 
                        onClick={() => setWizardOpen(true)}
                        className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar boleto
                      </Button>
                    </div>
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
                            <TableHead>Comunicação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBoletos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                Nenhum boleto encontrado com os filtros aplicados.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBoletos.map((boleto) => {
                              const empresa = mockEmpresas.find(e => e.nome === boleto.empresa);
                              const contato = empresa?.contatoPrincipal;
                              const formatWhatsappLink = (whatsapp?: string) => {
                                if (!whatsapp) return null;
                                const digits = whatsapp.replace(/\D/g, "");
                                return digits ? `https://wa.me/${digits}` : null;
                              };
                              const whatsappLink = formatWhatsappLink(contato?.whatsapp);
                              const effectiveStatus = getBoletoEffectiveStatus(boleto);

                              return (
                                <TableRow key={boleto.id}>
                                  <TableCell className="font-medium">{boleto.empresa}</TableCell>
                                  <TableCell>
                                    <span className="text-sm">{boleto.tipo}</span>
                                  </TableCell>
                                  <TableCell>
                                    R$ {boleto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell>{boleto.vencimento}</TableCell>
                                  <TableCell>{getStatusBadge(effectiveStatus)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        <div className="font-medium text-foreground">
                                          {contato?.nome || "Sem contato"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {whatsappLink ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            asChild
                                          >
                                            <a
                                              href={whatsappLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              aria-label={`Abrir conversa no WhatsApp com ${contato?.nome}`}
                                            >
                                              <MessageCircle className="h-4 w-4 text-green-600" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled
                                          >
                                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        )}
                                        {contato?.email ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            asChild
                                          >
                                            <a
                                              href={`mailto:${contato.email}`}
                                              aria-label={`Enviar e-mail para ${contato?.nome}`}
                                            >
                                              <Mail className="h-4 w-4 text-blue-600" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled
                                          >
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <BoletoActionsCell
                                      status={effectiveStatus}
                                      whatsappLink={whatsappLink}
                                      onDetails={() => navigate(`/dashboard/financeiro/${boleto.id}`)}
                                      onDownload={() => {
                                        toast({
                                          title: "Download iniciado (mock)",
                                          description: `Boleto de ${boleto.empresa} sendo baixado.`,
                                        });
                                      }}
                                      onGenerateNew={() => {
                                        setSelectedBoletoForNew({
                                          id: boleto.id,
                                          empresa: boleto.empresa,
                                          vencimento: boleto.vencimento,
                                          valor: boleto.valor,
                                        });
                                        setGerarNovoOpen(true);
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Modal for Gerar Novo Boleto */}
                <GerarNovoBoletoModal
                  open={gerarNovoOpen}
                  onOpenChange={setGerarNovoOpen}
                  boleto={selectedBoletoForNew}
                  onGenerate={(boletoId, novaData) => {
                    const original = boletos.find((b) => b.id === boletoId);
                    if (original) {
                      const empresaMatch = data?.empresas.find(
                        (empresa) => empresa.razao_social === original.empresa,
                      );
                      const payload: BoletoForm = {
                        tipo: original.tipo === "Contribuição Assistencial" ? "contribuicao" : "mensalidade",
                        empresaId: empresaMatch?.id ?? "",
                        empresaNome: original.empresa,
                        competenciaInicial: original.competenciaInicial ?? "",
                        competenciaFinal: original.competenciaFinal ?? "",
                        dataVencimento: format(novaData, "yyyy-MM-dd"),
                        faixaId: original.faixa ?? "",
                        unificarCompetencias: "Não",
                        mensagemPersonalizada: "",
                        anoContribuicao: original.ano ?? "",
                        periodicidade: original.periodicidade ?? "",
                        parcelas: original.parcelas ? String(original.parcelas) : "",
                        baseCalculo: original.base ? String(original.base) : "",
                        percentual: original.percentual ? String(original.percentual) : "",
                        descontos: original.descontos ? String(original.descontos) : "",
                        valorCalculado: original.valor,
                        pesquisaContribuicaoFeita: true,
                      };
                      createBoletoMutation.mutate(payload, {
                        onSuccess: () => {
                          toast({
                            title: "Novo boleto gerado",
                            description: `Boleto para ${original.empresa} atualizado.`,
                          });
                        },
                        onError: (err) => {
                          toast({
                            title: "Falha ao gerar novo boleto",
                            description: err instanceof Error ? err.message : "Tente novamente.",
                            variant: "destructive",
                          });
                        },
                      });
                    }
                    setSelectedBoletoForNew(null);
                  }}
                />
              </TabsContent>

              <TabsContent value="contribuicao" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Contribuição Assistencial
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pré-visualize as últimas emissões e acesse a página dedicada de histórico.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate("/dashboard/financeiro/contribuicao") }>
                        Ver histórico completo
                      </Button>
                      <Button className="bg-[#00A86B] hover:bg-[#00A86B]/90" onClick={() => setWizardOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar boleto
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
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ultimasContribuicoes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Nenhuma contribuição cadastrada ainda.
                              </TableCell>
                            </TableRow>
                          ) : (
                            ultimasContribuicoes.map((contrib) => (
                              <TableRow key={contrib.id}>
                                <TableCell>{contrib.ano}</TableCell>
                                <TableCell className="font-medium">{contrib.empresa}</TableCell>
                                <TableCell>{contrib.periodicidade}</TableCell>
                                <TableCell>{contrib.parcelas}</TableCell>
                                <TableCell>
                                  R$ {contrib.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>{contrib.vencimento}</TableCell>
                                <TableCell>{getSituacaoBadge(contrib.situacao)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#F7F8F4] border-secondary/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Calculadora disponível no wizard</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Utilize o fluxo de criação de boletos para calcular automaticamente o valor de Contribuição
                      Assistencial. A fórmula aplicada é: (Base de Cálculo × Percentual / 100) – Descontos/Isenções.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      A cada emissão, o histórico é atualizado e pode ser exportado na página dedicada.
                    </p>
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
                      <RadioGroup
                        value={boletoForm.tipo}
                        onValueChange={(value) => {
                          const tipoSelecionado = value as "mensalidade" | "contribuicao";
                          setBoletoForm({
                            ...boletoForm,
                            tipo: tipoSelecionado,
                            pesquisaContribuicaoFeita: false,
                            valorCalculado: 0,
                          });
                          setPreviaBoleto(null);
                          setContribuicaoPreview("");
                        }}
                      >
                        <div className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value="mensalidade" id="mensalidade" />
                          <Label htmlFor="mensalidade" className="cursor-pointer flex-1">
                            Mensalidade (por Faixa)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value="contribuicao" id="contribuicao" />
                          <Label htmlFor="contribuicao" className="flex-1">
                            Contribuição Assistencial
                            <span className="block text-xs text-muted-foreground mt-1">
                              Calculadora de alíquota integrada na etapa seguinte
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

                {/* Etapa 2: Detalhes por tipo */}
                {wizardStep === 2 && boletoForm.tipo === "mensalidade" && (
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
                            <Select
                              value={boletoForm.faixaId}
                              onValueChange={(value) => setBoletoForm({ ...boletoForm, faixaId: value })}
                            >
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
                          <Select
                            value={boletoForm.unificarCompetencias}
                            onValueChange={(value) => setBoletoForm({ ...boletoForm, unificarCompetencias: value })}
                          >
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
                          <Button
                            variant="outline"
                            onClick={() => {
                              toast({ title: "Filtro salvo (mock)", description: "Funcionalidade em desenvolvimento" });
                            }}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Filtro
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {wizardStep === 2 && boletoForm.tipo === "contribuicao" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalhes do Boleto - Contribuição Assistencial</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="anoContribuicao">Ano da Contribuição*</Label>
                            <Input
                              id="anoContribuicao"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="2025"
                              value={boletoForm.anoContribuicao}
                              onChange={(e) =>
                                setBoletoForm({ ...boletoForm, anoContribuicao: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="periodicidade">Periodicidade do Boleto*</Label>
                            <Select
                              value={boletoForm.periodicidade}
                              onValueChange={(value) => setBoletoForm({ ...boletoForm, periodicidade: value })}
                            >
                              <SelectTrigger id="periodicidade">
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="parcelas">Qtde. Parcelas*</Label>
                            <Select
                              value={boletoForm.parcelas}
                              onValueChange={(value) => setBoletoForm({ ...boletoForm, parcelas: value })}
                            >
                              <SelectTrigger id="parcelas">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {[...Array(12)].map((_, index) => {
                                  const value = (index + 1).toString();
                                  return (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vencimentoContrib">Data Vencimento* (dd/mm/aaaa)</Label>
                            <Input
                              id="vencimentoContrib"
                              placeholder="30/11/2025"
                              value={boletoForm.dataVencimento}
                              onChange={(e) => setBoletoForm({ ...boletoForm, dataVencimento: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="baseCalculoContrib">Base de Cálculo (R$)*</Label>
                              <Input
                                id="baseCalculoContrib"
                                type="number"
                                inputMode="decimal"
                                placeholder="20000"
                                value={boletoForm.baseCalculo}
                                onChange={(e) => setBoletoForm({ ...boletoForm, baseCalculo: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="percentualContrib">Percentual (%)*</Label>
                              <Input
                                id="percentualContrib"
                                type="number"
                                inputMode="decimal"
                                placeholder="1.5"
                                value={boletoForm.percentual}
                                onChange={(e) => setBoletoForm({ ...boletoForm, percentual: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="descontosContrib">Descontos/Isenções (R$)</Label>
                              <Input
                                id="descontosContrib"
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={boletoForm.descontos}
                                onChange={(e) => setBoletoForm({ ...boletoForm, descontos: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-3 rounded-lg border p-4 bg-neutral-100">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">Valor Calculado (R$)</p>
                              <Button size="sm" variant="outline" onClick={calcularValorContribuicao}>
                                Calcular
                              </Button>
                            </div>
                            <p className="text-3xl font-bold text-primary">
                              R$ {boletoForm.valorCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Valor Calculado = (Base de Cálculo × Percentual / 100) – Descontos/Isenções.
                            </p>
                          </div>
                        </div>

                        {contribuicaoPreview && (
                          <div className="bg-accent/20 p-4 rounded-lg">
                            <p className="text-sm font-medium">{contribuicaoPreview}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={handlePesquisarContribuicao} className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                            <Search className="h-4 w-4 mr-2" />
                            Pesquisar
                          </Button>
                          <Button variant="outline" onClick={handleLimparContribuicao}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Limpar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              toast({ title: "Filtro salvo (mock)", description: "Funcionalidade em desenvolvimento" });
                            }}
                          >
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
                            <p className="font-medium">
                              {boletoForm.tipo === "contribuicao"
                                ? "Contribuição Assistencial"
                                : "Mensalidade (por Faixa)"}
                            </p>
                          </div>

                          {boletoForm.tipo === "mensalidade" ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="font-semibold text-muted-foreground">Ano da Contribuição:</p>
                                <p className="font-medium">{boletoForm.anoContribuicao}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Periodicidade:</p>
                                <p className="font-medium">{boletoForm.periodicidade}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Qtde. Parcelas:</p>
                                <p className="font-medium">{boletoForm.parcelas}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Data de Vencimento:</p>
                                <p className="font-medium">{boletoForm.dataVencimento}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Base de Cálculo (R$):</p>
                                <p className="font-medium">
                                  R$ {parseCurrencyInput(boletoForm.baseCalculo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Percentual (%):</p>
                                <p className="font-medium">{boletoForm.percentual}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Descontos/Isenções (R$):</p>
                                <p className="font-medium">
                                  R$ {parseCurrencyInput(boletoForm.descontos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Valor Calculado (R$):</p>
                                <p className="font-medium text-primary">
                                  R$ {boletoForm.valorCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20 mt-4">
                          <p className="text-sm font-semibold text-muted-foreground">Valor estimado:</p>
                          <p className="text-3xl font-bold text-primary">
                            {boletoForm.tipo === "contribuicao"
                              ? `R$ ${boletoForm.valorCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : `R$ ${(previaBoleto || 0).toFixed(2)}`}
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
                      <Button onClick={handleNextStep} disabled={!canProceed}>
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Financeiro;
