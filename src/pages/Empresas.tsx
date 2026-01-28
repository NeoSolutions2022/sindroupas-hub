import { useEffect, useMemo, useRef, useState } from "react";
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
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { hasuraRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronDown,
  Download,
  Edit,
  Eye,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

const portes = ["MEI", "ME", "EPP", "LTDA", "SA"] as const;
const periodoOptions = [
  { value: "fundacao", label: "Fundação" },
  { value: "associacao", label: "Associação" },
  { value: "desassociacao", label: "Desassociação" },
] as const;

type Responsavel = {
  nome?: string;
  whatsapp?: string;
};

type Colaborador = {
  nome: string;
  cpf: string;
  whatsapp: string;
  cargo: string;
  email: string;
  observacoes?: string;
};

type Empresa = {
  id: string;
  logoUrl: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email?: string;
  whatsapp?: string;
  endereco?: string;
  associado: boolean;
  situacaoFinanceira: "Regular" | "Inadimplente";
  porte: typeof portes[number];
  capitalSocial?: number;
  faixaId?: string;
  faixaLabel?: string;
  dataFundacao: string;
  dataAssociacao?: string | null;
  dataDesassociacao?: string | null;
  responsavel?: Responsavel | null;
  colaboradores: Colaborador[];
};

type Faixa = {
  id: string;
  min: number;
  max: number;
  valor: number;
  label: string;
};

const fallbackFaixas: Faixa[] = [
  { id: "fx1", min: 1, max: 20, valor: 600, label: "1–20 • R$600" },
  { id: "fx2", min: 21, max: 50, valor: 850, label: "21–50 • R$850" },
];

const initialEmpresas: Empresa[] = [
  {
    id: "e1",
    logoUrl: "/logos/estilo.png",
    razaoSocial: "Estilo Nordeste Ltda",
    nomeFantasia: "Estilo Nordeste",
    cnpj: "11.222.333/0001-44",
    associado: true,
    situacaoFinanceira: "Regular",
    porte: "ME",
    capitalSocial: 200000,
    faixaId: "fx1",
    faixaLabel: "1–20 • R$600",
    dataFundacao: "2015-03-10",
    dataAssociacao: "2020-06-01",
    dataDesassociacao: null,
    email: "contato@estilonordeste.com",
    whatsapp: "(85) 3333-4444",
    endereco: "Rua das Flores, 123, Centro, Fortaleza/CE",
    responsavel: { nome: "Marina Costa", whatsapp: "(85) 99999-1234" },
    colaboradores: [
      {
        nome: "João Silva",
        cpf: "123.456.789-00",
        whatsapp: "(85) 99999-0000",
        cargo: "Compras",
        email: "joao@estilo.com",
      },
      {
        nome: "Maria Souza",
        cpf: "987.654.321-00",
        whatsapp: "(85) 98888-1111",
        cargo: "Financeiro",
        email: "maria@estilo.com",
      },
    ],
  },
  {
    id: "e2",
    logoUrl: "/logos/modasul.png",
    razaoSocial: "ModaSul Indústria e Comércio S.A.",
    nomeFantasia: "ModaSul",
    cnpj: "22.333.444/0001-55",
    associado: false,
    situacaoFinanceira: "Inadimplente",
    porte: "EPP",
    capitalSocial: 500000,
    faixaId: "fx2",
    faixaLabel: "21–50 • R$850",
    dataFundacao: "2012-08-20",
    dataAssociacao: null,
    dataDesassociacao: null,
    email: "contato@modasul.com",
    whatsapp: "(85) 3555-6666",
    endereco: "Av. Principal, 456, Aldeota, Fortaleza/CE",
    responsavel: null,
    colaboradores: [
      {
        nome: "Bruno Lima",
        cpf: "222.333.444-55",
        whatsapp: "(85) 97777-2222",
        cargo: "Diretor",
        email: "bruno@modasul.com",
      },
    ],
  },
];

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
};

const formatCnpj = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const formatCpf = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{2})$/, "$1-$2")
    .slice(0, 14);
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .slice(0, 15);
};

type EmpresasQueryResponse = {
  data?: {
    empresas: {
      id: string;
      logo_url?: string | null;
      razao_social?: string | null;
      nome_fantasia?: string | null;
      cnpj?: string | null;
      email?: string | null;
      whatsapp?: string | null;
      endereco?: string | null;
      associada?: boolean | null;
      situacao_financeira?: string | null;
      porte?: string | null;
      capital_social?: number | null;
      data_fundacao?: string | null;
      data_associacao?: string | null;
      data_desassociacao?: string | null;
      faixa?: {
        id: string;
        label?: string | null;
        min_colaboradores?: number | null;
        max_colaboradores?: number | null;
        valor_mensalidade?: number | null;
      } | null;
      responsaveis?: { nome?: string | null; whatsapp?: string | null }[];
      colaboradores?: {
        nome?: string | null;
        cpf?: string | null;
        whatsapp?: string | null;
        cargo?: string | null;
        email?: string | null;
        observacoes?: string | null;
      }[];
    }[];
    faixas: {
      id: string;
      label?: string | null;
      min_colaboradores?: number | null;
      max_colaboradores?: number | null;
      valor_mensalidade?: number | null;
    }[];
  };
  errors?: { message: string }[];
};

const Empresas = () => {
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas);
  const [faixas, setFaixas] = useState<Faixa[]>(fallbackFaixas);
  const [searchTerm, setSearchTerm] = useState("");
  const [associationFilter, setAssociationFilter] = useState<"Todas" | "Associadas" | "Não associadas">("Todas");
  const [situacaoFilter, setSituacaoFilter] = useState<"Todas" | "Regular" | "Inadimplente">("Todas");
  const [porteFilter, setPorteFilter] = useState<string>("");
  const [faixaFilter, setFaixaFilter] = useState<string>("");
  const [periodoTipo, setPeriodoTipo] = useState<typeof periodoOptions[number]["value"]>("fundacao");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const response = await hasuraRequest<EmpresasQueryResponse>(`
          query Empresas {
            empresas(order_by: { nome_fantasia: asc }) {
              id
              logo_url
              razao_social
              nome_fantasia
              cnpj
              email
              whatsapp
              endereco
              associada
              situacao_financeira
              porte
              capital_social
              data_fundacao
              data_associacao
              data_desassociacao
              faixa {
                id
                label
                min_colaboradores
                max_colaboradores
                valor_mensalidade
              }
              responsaveis(limit: 1) {
                nome
                whatsapp
              }
              colaboradores {
                nome
                cpf
                whatsapp
                cargo
                email
                observacoes
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
        `);

        if (response.errors?.length) {
          throw new Error(response.errors[0]?.message);
        }

        const data = response.data;
        if (!data) return;

        const mappedFaixas = data.faixas.map((faixa) => ({
          id: faixa.id,
          min: faixa.min_colaboradores ?? 0,
          max: faixa.max_colaboradores ?? 0,
          valor: faixa.valor_mensalidade ?? 0,
          label:
            faixa.label ??
            `${faixa.min_colaboradores ?? 0}–${faixa.max_colaboradores ?? 0} • R$${(
              faixa.valor_mensalidade ?? 0
            ).toFixed(0)}`,
        }));

        const mappedEmpresas = data.empresas.map((empresa) => {
          const faixa = empresa.faixa;
          return {
            id: empresa.id,
            logoUrl: empresa.logo_url ?? "",
            razaoSocial: empresa.razao_social ?? "",
            nomeFantasia: empresa.nome_fantasia ?? "",
            cnpj: empresa.cnpj ?? "",
            email: empresa.email ?? undefined,
            whatsapp: empresa.whatsapp ?? undefined,
            endereco: empresa.endereco ?? undefined,
            associado: Boolean(empresa.associada),
            situacaoFinanceira:
              empresa.situacao_financeira === "Inadimplente" ? "Inadimplente" : "Regular",
            porte: portes.includes(empresa.porte as (typeof portes)[number])
              ? (empresa.porte as (typeof portes)[number])
              : "ME",
            capitalSocial: empresa.capital_social ?? undefined,
            faixaId: faixa?.id,
            faixaLabel: faixa
              ? faixa.label ??
                `${faixa.min_colaboradores ?? 0}–${faixa.max_colaboradores ?? 0} • R$${(
                  faixa.valor_mensalidade ?? 0
                ).toFixed(0)}`
              : undefined,
            dataFundacao: empresa.data_fundacao ?? "",
            dataAssociacao: empresa.data_associacao ?? null,
            dataDesassociacao: empresa.data_desassociacao ?? null,
            responsavel: empresa.responsaveis?.[0]
              ? {
                  nome: empresa.responsaveis[0].nome ?? undefined,
                  whatsapp: empresa.responsaveis[0].whatsapp ?? undefined,
                }
              : null,
            colaboradores:
              empresa.colaboradores?.map((colaborador) => ({
                nome: colaborador.nome ?? "",
                cpf: colaborador.cpf ?? "",
                whatsapp: colaborador.whatsapp ?? "",
                cargo: colaborador.cargo ?? "",
                email: colaborador.email ?? "",
                observacoes: colaborador.observacoes ?? undefined,
              })) ?? [],
          } as Empresa;
        });

        setFaixas(mappedFaixas.length ? mappedFaixas : fallbackFaixas);
        setEmpresas(mappedEmpresas.length ? mappedEmpresas : initialEmpresas);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar empresas.";
        toast({
          title: "Erro ao carregar dados",
          description: message,
          variant: "destructive",
        });
        setEmpresas(initialEmpresas);
        setFaixas(fallbackFaixas);
      }
    };

    loadEmpresas();
  }, [toast]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Empresa>>({ colaboradores: [] });
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const colaboradorMatch = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const lower = searchTerm.trim().toLowerCase();
    for (const empresa of empresas) {
      for (const colaborador of empresa.colaboradores) {
        if (colaborador.nome.toLowerCase().includes(lower)) {
          return {
            colaboradorNome: colaborador.nome,
            empresaId: empresa.id,
            empresaNome: empresa.nomeFantasia,
          };
        }
      }
    }
    return null;
  }, [empresas, searchTerm]);

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((empresa) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        empresa.razaoSocial.toLowerCase().includes(search) ||
        empresa.nomeFantasia.toLowerCase().includes(search) ||
        empresa.cnpj.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
        empresa.colaboradores.some((colaborador) => colaborador.nome.toLowerCase().includes(search));

      const matchesAssociacao =
        associationFilter === "Todas" ||
        (associationFilter === "Associadas" && empresa.associado) ||
        (associationFilter === "Não associadas" && !empresa.associado);

      const matchesSituacao = situacaoFilter === "Todas" || empresa.situacaoFinanceira === situacaoFilter;
      const matchesPorte = !porteFilter || empresa.porte === porteFilter;
      const matchesFaixa = !faixaFilter || empresa.faixaId === faixaFilter;

      const dateField =
        periodoTipo === "fundacao"
          ? empresa.dataFundacao
          : periodoTipo === "associacao"
            ? empresa.dataAssociacao
            : empresa.dataDesassociacao;

      const matchesPeriodo = (() => {
        if (!periodoInicio && !periodoFim) return true;
        if (!dateField) return false;
        const value = new Date(dateField).getTime();
        const inicioTime = periodoInicio ? new Date(periodoInicio).getTime() : undefined;
        const fimTime = periodoFim ? new Date(periodoFim).getTime() : undefined;
        if (inicioTime && value < inicioTime) return false;
        if (fimTime && value > fimTime) return false;
        return true;
      })();

      return matchesSearch && matchesAssociacao && matchesSituacao && matchesPorte && matchesFaixa && matchesPeriodo;
    });
  }, [associationFilter, empresas, faixaFilter, periodoFim, periodoInicio, periodoTipo, porteFilter, searchTerm, situacaoFilter]);

  const highlightedEmpresaId = colaboradorMatch?.empresaId ?? null;

  const handleOpenDialog = (empresa?: Empresa, viewMode = false) => {
    setIsViewMode(viewMode);
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({
        ...empresa,
        colaboradores: empresa.colaboradores.length
          ? empresa.colaboradores.map((colaborador) => ({ ...colaborador }))
          : [
              { nome: "", cpf: "", whatsapp: "", cargo: "", email: "" },
            ],
        responsavel: empresa.responsavel ? { ...empresa.responsavel } : { nome: "", whatsapp: "" },
      });
      setLogoPreview(empresa.logoUrl);
    } else {
      setEditingEmpresa(null);
      setFormData({
        associado: true,
        situacaoFinanceira: "Regular",
        porte: "ME",
        colaboradores: [{ nome: "", cpf: "", whatsapp: "", cargo: "", email: "" }],
        responsavel: { nome: "", whatsapp: "" },
      });
      setLogoPreview("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmpresa(null);
    setIsViewMode(false);
    setFormData({ colaboradores: [] });
    setLogoPreview("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDownload = () => {
    if (formData.logoUrl) {
      const link = document.createElement("a");
      link.href = formData.logoUrl;
      link.download = `${formData.nomeFantasia || "logo-empresa"}.png`;
      link.click();
      toast({
        title: "Download iniciado",
        description: "Logo da empresa está sendo baixada.",
      });
    }
  };

  const addColaborador = () => {
    setFormData((prev) => ({
      ...prev,
      colaboradores: [
        ...(prev.colaboradores || []),
        { nome: "", cpf: "", whatsapp: "", cargo: "", email: "" },
      ],
    }));
  };

  const removeColaborador = (index: number) => {
    setFormData((prev) => {
      const colaboradores = [...(prev.colaboradores || [])];
      colaboradores.splice(index, 1);
      return { ...prev, colaboradores };
    });
  };

  const updateColaborador = (index: number, field: keyof Colaborador, value: string) => {
    setFormData((prev) => {
      const colaboradores = [...(prev.colaboradores || [])];
      const formattedValue =
        field === "cpf" ? formatCpf(value) : field === "whatsapp" ? formatPhone(value) : value;
      colaboradores[index] = { ...colaboradores[index], [field]: formattedValue };
      return { ...prev, colaboradores };
    });
  };

  const handleResponsavelChange = (field: keyof Responsavel, value: string) => {
    setFormData((prev) => ({
      ...prev,
      responsavel: {
        ...(prev.responsavel || {}),
        [field]: field === "whatsapp" ? formatPhone(value) : value,
      },
    }));
  };

  const handleFaixaChange = (value: string) => {
    if (!value || value === "none") {
      setFormData((prev) => ({ ...prev, faixaId: undefined, faixaLabel: undefined }));
      return;
    }
    const faixaSelecionada = faixas.find((faixa) => faixa.id === value);
    setFormData((prev) => ({ ...prev, faixaId: value, faixaLabel: faixaSelecionada?.label }));
  };

  const handleSave = () => {
    const requiredFields = [
      formData.razaoSocial,
      formData.cnpj,
      typeof formData.associado === "boolean" ? "ok" : "",
      formData.situacaoFinanceira,
      formData.porte,
      formData.dataFundacao,
    ];
    const hasEmpty = requiredFields.some((field) => field === undefined || field === "");

    if (hasEmpty) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Campos marcados com * são necessários para salvar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Empresas atualizado com sucesso",
      description: "As informações foram registradas corretamente.",
    });

    handleCloseDialog();
  };

  const handleDelete = (empresa: Empresa) => {
    setEmpresaToDelete(empresa);
  };

  const confirmDelete = () => {
    toast({
      title: "Empresa excluída",
      description: "Registro removido com sucesso.",
      variant: "destructive",
    });
    setEmpresaToDelete(null);
  };

  const getContatoPrincipal = (empresa: Empresa) => {
    const responsavelTemWhats = Boolean(empresa.responsavel?.whatsapp);
    if (empresa.responsavel?.nome && responsavelTemWhats) {
      return { nome: empresa.responsavel.nome, whatsapp: empresa.responsavel.whatsapp };
    }

    if ((!empresa.responsavel || !responsavelTemWhats) && empresa.colaboradores.length) {
      const colaboradorComWhats = empresa.colaboradores.find((colaborador) => colaborador.whatsapp);
      if (colaboradorComWhats) {
        return { nome: colaboradorComWhats.nome, whatsapp: colaboradorComWhats.whatsapp };
      }
    }

    if (empresa.responsavel?.nome) {
      return { nome: empresa.responsavel.nome, whatsapp: "—" };
    }

    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-neutral-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#1C1C1C]">Empresas</h1>
                <p className="text-muted-foreground">Gestão de associadas, status financeiro e equipes</p>
              </div>
              <Button onClick={() => handleOpenDialog()} className="bg-[#1C1C1C] hover:bg-[#1C1C1C]/90" aria-label="Cadastrar nova empresa">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Empresa
              </Button>
            </div>

            <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#1C1C1C]">Filtros</span>
                  <span className="text-xs text-muted-foreground">Refine a visualização das empresas com os filtros abaixo.</span>
                </div>
                <Button
                  variant="ghost"
                  className="self-start shrink-0 p-0 text-sm font-semibold text-[#1C1C1C] hover:bg-transparent hover:underline"
                  onClick={() => {
                    setSearchTerm("");
                    setAssociationFilter("Todas");
                    setSituacaoFilter("Todas");
                    setPorteFilter("");
                    setFaixaFilter("");
                    setPeriodoTipo("fundacao");
                    setPeriodoInicio("");
                    setPeriodoFim("");
                  }}
                  aria-label="Limpar filtros"
                >
                  Limpar filtros
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Buscar empresa ou colaborador"
                    placeholder="Buscar por nome, CNPJ ou palavra-chave…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 rounded-full border-[#CBD5B1] bg-white pl-10 text-sm"
                  />
                  {colaboradorMatch && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {colaboradorMatch.colaboradorNome} • Colaborador — {colaboradorMatch.empresaNome}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
                    {["Todas", "Associadas", "Não associadas"].map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={associationFilter === status ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex-1 rounded-full text-xs",
                          associationFilter === status
                            ? "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90"
                            : "bg-transparent text-[#1C1C1C] hover:bg-[#DCE7CB]/50"
                        )}
                        onClick={() => setAssociationFilter(status as typeof associationFilter)}
                        aria-label={`Filtrar por ${status}`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>

                  <Select value={situacaoFilter} onValueChange={(value) => setSituacaoFilter(value as typeof situacaoFilter)}>
                    <SelectTrigger
                      aria-label="Filtrar por situação financeira"
                      className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm"
                    >
                      <SelectValue placeholder="Situação Financeira" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Situação Financeira: Todas</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={porteFilter || "all"}
                    onValueChange={(value) => setPorteFilter(value === "all" ? "" : value)}
                  >
                    <SelectTrigger
                      aria-label="Filtrar por porte"
                      className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm"
                    >
                      <SelectValue placeholder="Porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os portes</SelectItem>
                      {portes.map((porte) => (
                        <SelectItem key={porte} value={porte}>
                          {porte}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={faixaFilter || "all"}
                    onValueChange={(value) => setFaixaFilter(value === "all" ? "" : value)}
                  >
                    <SelectTrigger
                      aria-label="Filtrar por faixa"
                      className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm"
                    >
                      <SelectValue placeholder="Faixa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as faixas</SelectItem>
                      {faixas.map((faixa) => (
                        <SelectItem key={faixa.id} value={faixa.id}>
                          {faixa.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={periodoTipo}
                    onValueChange={(value) =>
                      setPeriodoTipo(value as (typeof periodoOptions)[number]["value"])
                    }
                  >
                    <SelectTrigger
                      aria-label="Selecionar período para filtro"
                      className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm"
                    >
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 rounded-full border border-[#CBD5B1] bg-white px-3 py-2 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      type="date"
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                      aria-label="Data inicial do período"
                      className="border-none p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-[#CBD5B1] bg-white px-3 py-2 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      type="date"
                      value={periodoFim}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                      aria-label="Data final do período"
                      className="border-none p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C1C1C]">Empresas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Logo</TableHead>
                        <TableHead scope="col">Empresa</TableHead>
                        <TableHead scope="col">CNPJ</TableHead>
                        <TableHead scope="col">Associado</TableHead>
                        <TableHead scope="col">Situação Financeira</TableHead>
                        <TableHead scope="col">Porte</TableHead>
                        <TableHead scope="col">Capital Social</TableHead>
                        <TableHead scope="col">Faixa</TableHead>
                        <TableHead scope="col">Datas</TableHead>
                        <TableHead scope="col">Responsável p/ contato</TableHead>
                        <TableHead scope="col">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmpresas.map((empresa) => {
                        const contato = getContatoPrincipal(empresa);
                        return (
                          <TableRow
                            key={empresa.id}
                            className={cn(
                              highlightedEmpresaId === empresa.id && "bg-[#DCE7CB]/60"
                            )}
                          >
                            <TableCell>
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={empresa.logoUrl} alt={`Logo ${empresa.nomeFantasia}`} />
                                <AvatarFallback>{empresa.nomeFantasia.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-[#1C1C1C]">{empresa.razaoSocial}</p>
                              <p className="text-sm text-muted-foreground">{empresa.nomeFantasia}</p>
                            </TableCell>
                            <TableCell>{empresa.cnpj}</TableCell>
                            <TableCell>
                              <Badge className={empresa.associado ? "bg-[#7E8C5E] text-white" : "bg-secondary text-[#1C1C1C]"}>
                                {empresa.associado ? "Sim" : "Não"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={empresa.situacaoFinanceira === "Regular" ? "bg-[#DCE7CB] text-[#1C1C1C]" : "bg-red-500 text-white"}>
                                {empresa.situacaoFinanceira}
                              </Badge>
                            </TableCell>
                            <TableCell>{empresa.porte}</TableCell>
                            <TableCell>{formatCurrency(empresa.capitalSocial)}</TableCell>
                            <TableCell>{empresa.faixaLabel || "—"}</TableCell>
                            <TableCell className="text-sm">
                              <span className="font-semibold">Fundação:</span> {formatDate(empresa.dataFundacao)}
                              <br />
                              <span className="font-semibold">Associação:</span> {formatDate(empresa.dataAssociacao)}
                              <br />
                              <span className="font-semibold">Desassociação:</span> {formatDate(empresa.dataDesassociacao)}
                            </TableCell>
                            <TableCell>
                              {contato ? (
                                <div>
                                  <p className="font-medium">{contato.nome}</p>
                                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MessageCircle className="h-3.5 w-3.5" /> {contato.whatsapp}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => handleOpenDialog(empresa, true)}
                                  aria-label={`Visualizar ${empresa.nomeFantasia}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => handleOpenDialog(empresa, false)}
                                  aria-label={`Editar ${empresa.nomeFantasia}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => handleDelete(empresa)}
                                  aria-label={`Excluir ${empresa.nomeFantasia}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filteredEmpresas.length === 0 && (
                    <p className="py-6 text-center text-muted-foreground">Nenhuma empresa encontrada com os filtros selecionados.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseDialog();
                } else {
                  setIsDialogOpen(true);
                }
              }}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEmpresa ? (isViewMode ? "Visualizar Empresa" : "Editar Empresa") : "Cadastrar Empresa"}</DialogTitle>
                  <DialogDescription>
                    Preencha os campos obrigatórios para manter os dados atualizados.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Logo da Empresa</Label>
                    <div className="flex flex-wrap items-center gap-4">
                      {logoPreview && (
                        <Avatar className="h-16 w-16 border">
                          <AvatarImage src={logoPreview} alt="Logo da empresa" />
                          <AvatarFallback>Logo</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <input
                          id="logo-upload"
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isViewMode}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={isViewMode}
                          onClick={() => !isViewMode && logoInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                        {logoPreview && editingEmpresa && (
                          <Button variant="outline" size="sm" onClick={handleLogoDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social*</Label>
                      <Input
                        id="razaoSocial"
                        placeholder="Digite a razão social"
                        value={formData.razaoSocial || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input
                        id="nomeFantasia"
                        placeholder="Digite o nome fantasia"
                        value={formData.nomeFantasia || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nomeFantasia: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ*</Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: formatCnpj(e.target.value) }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@empresa.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp (geral)</Label>
                      <Input
                        id="whatsapp"
                        placeholder="(00) 00000-0000"
                        value={formData.whatsapp || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        placeholder="Rua, número, bairro, cidade"
                        value={formData.endereco || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Associado*</Label>
                      <Select
                        value={
                          formData.associado === undefined
                            ? "unset"
                            : formData.associado
                              ? "sim"
                              : "nao"
                        }
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            associado: value === "unset" ? undefined : value === "sim",
                          }))
                        }
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Selecione</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Situação Financeira*</Label>
                      <Select
                        value={formData.situacaoFinanceira || "unset"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            situacaoFinanceira:
                              value === "unset"
                                ? undefined
                                : (value as Empresa["situacaoFinanceira"]),
                          }))
                        }
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Selecione</SelectItem>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Porte*</Label>
                      <Select
                        value={formData.porte || "unset"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            porte: value === "unset" ? undefined : (value as Empresa["porte"]),
                          }))
                        }
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Selecione</SelectItem>
                          {portes.map((porte) => (
                            <SelectItem key={porte} value={porte}>
                              {porte}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Capital Social (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0,00"
                        value={formData.capitalSocial !== undefined ? String(formData.capitalSocial) : ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            capitalSocial: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="fundacao">Fundação*</Label>
                      <Input
                        id="fundacao"
                        type="date"
                        value={formData.dataFundacao || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataFundacao: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="associacao">Associação</Label>
                      <Input
                        id="associacao"
                        type="date"
                        value={formData.dataAssociacao || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataAssociacao: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desassociacao">Desassociação</Label>
                      <Input
                        id="desassociacao"
                        type="date"
                        value={formData.dataDesassociacao || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dataDesassociacao: e.target.value }))}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Faixa</Label>
                    <Select
                      value={formData.faixaId || "none"}
                      onValueChange={handleFaixaChange}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem faixa</SelectItem>
                        {faixas.map((faixa) => (
                          <SelectItem key={faixa.id} value={faixa.id}>
                            {faixa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1C1C1C]">Responsável (opcional)</h3>
                      <p className="text-sm text-muted-foreground">
                        Usado como contato principal se houver WhatsApp informado.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          placeholder="Nome do responsável"
                          value={formData.responsavel?.nome || ""}
                          onChange={(e) => handleResponsavelChange("nome", e.target.value)}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={formData.responsavel?.whatsapp || ""}
                          onChange={(e) => handleResponsavelChange("whatsapp", e.target.value)}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C]">Colaboradores</h3>
                        <p className="text-sm text-muted-foreground">Cadastre quantos colaboradores forem necessários.</p>
                      </div>
                      {!isViewMode && (
                        <Button variant="outline" size="sm" onClick={addColaborador} aria-label="Adicionar colaborador">
                          <Plus className="mr-2 h-4 w-4" /> Adicionar colaborador
                        </Button>
                      )}
                    </div>

                    {(formData.colaboradores || []).map((colaborador, index) => (
                      <Card key={`colaborador-${index}`} className="border border-dashed">
                        <CardContent className="space-y-4 pt-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-[#1C1C1C]">Colaborador {index + 1}</h4>
                            {!isViewMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeColaborador(index)}
                                aria-label={`Remover colaborador ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nome*</Label>
                              <Input
                                placeholder="Nome completo"
                                value={colaborador.nome}
                                onChange={(e) => updateColaborador(index, "nome", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CPF*</Label>
                              <Input
                                placeholder="000.000.000-00"
                                value={colaborador.cpf}
                                onChange={(e) => updateColaborador(index, "cpf", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>WhatsApp</Label>
                              <Input
                                placeholder="(00) 00000-0000"
                                value={colaborador.whatsapp}
                                onChange={(e) => updateColaborador(index, "whatsapp", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Cargo</Label>
                              <Input
                                placeholder="Cargo ou função"
                                value={colaborador.cargo}
                                onChange={(e) => updateColaborador(index, "cargo", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>E-mail</Label>
                              <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={colaborador.email}
                                onChange={(e) => updateColaborador(index, "email", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Observações</Label>
                              <Input
                                placeholder="Observações adicionais"
                                value={colaborador.observacoes || ""}
                                onChange={(e) => updateColaborador(index, "observacoes", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    {!isViewMode && (
                      <Button onClick={handleSave} className="bg-[#1C1C1C] hover:bg-[#1C1C1C]/90">
                        Salvar
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={!!empresaToDelete}
              onOpenChange={(open) => {
                if (!open) {
                  setEmpresaToDelete(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Empresas;
