import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { hasuraRequest } from "@/lib/api/hasura";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit,
  Eye,
  ExternalLink,
  History,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Clock3,
} from "lucide-react";

const portes = ["MEI", "ME", "EPP", "Médias e Grandes Empresas", "LTDA", "SA"] as const;
const periodoOptions = [
  { value: "fundacao", label: "Fundação" },
  { value: "associacao", label: "Associação" },
  { value: "desassociacao", label: "Desassociação" },
] as const;

const normalizeSearchText = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type Responsavel = {
  nome?: string;
  cpf?: string;
  dataAniversario?: string;
  whatsapp?: string;
  email?: string;
  contatoPrincipal?: boolean;
};

type Colaborador = {
  nome: string;
  cpf: string;
  whatsapp: string;
  cargo: string;
  email: string;
  observacoes?: string;
};

type TipoRelacionamento = "Parceiro" | "Mantenedor" | "Fornecedor";
type TipoVinculo = "Associado" | "Mantenedor" | "Parceiro" | "Fornecedor";
type CategoriaMantenedor = "Ouro" | "Prata" | "Bronze";
type RelacionamentoEmpresa = {
  id?: string;
  tipo: TipoRelacionamento;
  categoria?: string;
  status: string;
  descricao?: string;
  contrapartidas?: string;
  observacoes?: string;
};

type SocioEmpresa = {
  id?: string;
  nome: string;
  qualificacao?: string;
  paisOrigem?: string;
  nomeRepresentanteLegal?: string;
  qualificacaoRepresentanteLegal?: string;
};

type AtividadeEconomica = {
  id?: string;
  codigo: string;
  descricao: string;
  principal: boolean;
};

const relacionamentoTipoOptions: TipoRelacionamento[] = ["Parceiro", "Mantenedor", "Fornecedor"];
const categoriasParceiro = ["Universidade", "IEL", "FIRJAN", "SEBRAE", "Associação", "Fomento"];
const categoriasFornecedor = ["Estrutura", "Papelaria", "Brindes", "Audiovisual"];
const relacionamentoStatusOptions: Record<TipoRelacionamento, string[]> = {
  Parceiro: ["Ativo", "Em avaliação", "Encerrado"],
  Mantenedor: ["Ativo", "Encerrado"],
  Fornecedor: ["Ativo", "Em análise", "Recusado"],
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
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  associado: boolean;
  tipoVinculo?: TipoVinculo;
  categoriaMantenedor?: CategoriaMantenedor;
  valorMensalidadeVinculo?: number;
  situacaoFinanceira: "Regular" | "Inadimplente";
  porte: typeof portes[number];
  capitalSocial?: number;
  descontoMensalidadePercentual?: number;
  faixaId?: string;
  faixaLabel?: string;
  dataFundacao: string;
  dataAssociacao?: string | null;
  dataDesassociacao?: string | null;
  responsavel?: Responsavel | null;
  responsaveis: Responsavel[];
  colaboradores: Colaborador[];
  relacionamentos: RelacionamentoEmpresa[];
  socios: SocioEmpresa[];
  atividadesEconomicas: AtividadeEconomica[];
  qtdFuncionarios?: number;
  observacoesSolicitacao?: string;
};

type SolicitacaoAssociacaoPayload = {
  responsaveis?: Responsavel[];
  colaboradores?: Colaborador[];
  relacionamentos?: RelacionamentoEmpresa[];
  socios?: SocioEmpresa[];
  atividadesEconomicas?: AtividadeEconomica[];
  enderecoDetalhado?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
  };
};

type Faixa = {
  id: string;
  min: number;
  max: number;
  valor: number;
  label: string;
};

const FAIXA_LIMITES_POR_NUMERO: Record<number, { min: number; max: number | null }> = {
  1: { min: 0, max: 50 },
  2: { min: 51, max: 100 },
  3: { min: 101, max: 200 },
  4: { min: 201, max: 500 },
  5: { min: 501, max: null },
};

const getFaixaLimites = (faixa: Faixa) => {
  const labelNormalizado = normalizeSearchText(faixa.label);
  const numeroFaixa = Number(labelNormalizado.match(/\bfaixa\s*([1-5])\b/)?.[1]);
  const limitesPadrao = FAIXA_LIMITES_POR_NUMERO[numeroFaixa];

  if (limitesPadrao) return limitesPadrao;

  const min = Number(faixa.min ?? 0);
  const max = Number(faixa.max ?? 0);
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) && max > 0 ? max : null,
  };
};

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

const parseAssociationDate = (value?: string | null) => {
  if (!value) return null;
  const datePart = value.slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatAssociationDate = (value?: string | null) => {
  const parsed = parseAssociationDate(value);
  return parsed ? new Intl.DateTimeFormat("pt-BR").format(parsed) : "Data não informada";
};

const getAssociationDuration = (value?: string | null) => {
  const start = parseAssociationDate(value);
  if (!start) return "Tempo não calculado";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start > today) return "Associação futura";

  let totalMonths = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) totalMonths -= 1;

  if (totalMonths >= 12) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return `${years} ${years === 1 ? "ano" : "anos"}${months ? ` e ${months} ${months === 1 ? "mês" : "meses"}` : ""}`;
  }

  if (totalMonths >= 1) return `${totalMonths} ${totalMonths === 1 ? "mês" : "meses"}`;

  const days = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  if (days === 0) return "Associada hoje";
  return `${days} ${days === 1 ? "dia" : "dias"}`;
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

const formatCep = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);

type EmpresaRow = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  associada?: boolean | null;
  tipo_vinculo?: TipoVinculo | null;
  categoria_mantenedor?: CategoriaMantenedor | null;
  valor_mensalidade_vinculo?: number | null;
  situacao_financeira?: "Regular" | "Inadimplente" | null;
  porte?: string | null;
  capital_social?: number | null;
  desconto_mensalidade_percentual?: number | null;
  faixa_id?: string | null;
  data_fundacao?: string | null;
  data_associacao?: string | null;
  data_desassociacao?: string | null;
  responsaveis?: {
    id: string;
    nome?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    data_aniversario?: string | null;
    cpf?: string | null;
    contato_principal?: boolean | null;
  }[];
  relacionamentos?: {
    id: string;
    tipo?: string | null;
    categoria?: string | null;
    status?: string | null;
    descricao?: string | null;
    contrapartidas?: string | null;
    observacoes?: string | null;
  }[];
  colaboradores?: {
    id: string;
    nome?: string | null;
    cpf?: string | null;
    whatsapp?: string | null;
    cargo?: string | null;
    email?: string | null;
    observacoes?: string | null;
  }[];
};

type SocioRow = {
  id: string;
  empresa_id: string;
  nome: string;
  qualificacao?: string | null;
  pais_origem?: string | null;
  nome_representante_legal?: string | null;
  qualificacao_representante_legal?: string | null;
};

type AtividadeEconomicaRow = {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao: string;
  principal: boolean;
};

type SolicitacaoAssociacaoRow = {
  id: string;
  status: "pendente" | "em_analise" | "aprovado" | "recusado" | "convertido" | string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  porte?: string | null;
  capital_social?: number | null;
  data_fundacao?: string | null;
  qtd_funcionarios?: number | null;
  responsavel_nome?: string | null;
  responsavel_cpf?: string | null;
  responsavel_email?: string | null;
  responsavel_whatsapp?: string | null;
  responsavel_data_nascimento?: string | null;
  payload?: SolicitacaoAssociacaoPayload | null;
  observacoes?: string | null;
  created_at?: string | null;
};

const getEmpresaDisplayName = (empresa: Pick<EmpresaRow, "nome_fantasia" | "razao_social">) => {
  return empresa.nome_fantasia?.trim() || empresa.razao_social?.trim() || "Empresa sem nome";
};

type FaixaRow = {
  id: string;
  label?: string | null;
  min_colaboradores?: number | null;
  max_colaboradores?: number | null;
  valor_mensalidade?: number | null;
};

type ReceitaWsResponse = {
  status?: "OK" | "ERROR" | string;
  message?: string;
  cnpj?: string;
  abertura?: string;
  nome?: string;
  fantasia?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  porte?: string;
  capital_social?: string;
  qsa?: {
    nome?: string;
    qual?: string;
    pais_origem?: string;
    nome_rep_legal?: string;
    qual_rep_legal?: string;
  }[];
  atividade_principal?: { code?: string; text?: string }[];
  atividades_secundarias?: { code?: string; text?: string }[];
};

const RECEITA_WS_PROXY_BASE_PATH = "/api/receitaws/v1/cnpj";
const VIA_CEP_BASE_URL = "https://viacep.com.br/ws";

const ufOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

const buildReceitaWsRequestUrl = (cnpj: string) => `${RECEITA_WS_PROXY_BASE_PATH}/${cnpj}`;

const parseReceitaWsDate = (value?: string) => {
  if (!value) return undefined;
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return undefined;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const normalizeReceitaWsPorte = (value?: string): Empresa["porte"] | undefined => {
  const normalized = normalizeSearchText(value);
  if (!normalized) return undefined;
  if (normalized.includes("mei") || normalized.includes("microempreendedor")) return "MEI";
  if (normalized.includes("micro empresa") || normalized.includes("microempresa")) return "ME";
  if (normalized.includes("pequeno porte") || normalized.includes("epp")) return "EPP";
  if (normalized.includes("sociedade anonima") || normalized === "sa" || normalized.includes("s/a")) return "SA";
  if (normalized.includes("ltda") || normalized.includes("limitada")) return "LTDA";
  return undefined;
};

const parseReceitaWsCapital = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildEmpresaEndereco = (values: Partial<Empresa>) => {
  const street = [values.logradouro?.trim(), values.numero?.trim()].filter(Boolean).join(", ");
  const details = [values.complemento?.trim(), values.bairro?.trim()].filter(Boolean).join(" - ");
  const city = [values.municipio?.trim(), values.uf?.trim()].filter(Boolean).join("/");
  const cep = values.cep?.trim() ? `CEP ${values.cep.trim()}` : "";
  return [street, details, city, cep].filter(Boolean).join(" • ");
};

const parseEnderecoParts = (endereco?: string | null): Partial<Empresa> => {
  if (!endereco) return {};
  const [streetPart = "", detailsPart = "", cityPart = "", cepPart = ""] = endereco.split(" • ").map((part) => part.trim());
  const [logradouro = "", numero = ""] = streetPart.split(/,\s*/);
  const [complementoOrBairro = "", bairroMaybe = ""] = detailsPart.split(/\s+-\s+/);
  const [municipio = "", uf = ""] = cityPart.split("/");
  const cep = cepPart.replace(/^CEP\s*/i, "");

  return {
    logradouro: logradouro || undefined,
    numero: numero || undefined,
    complemento: bairroMaybe ? complementoOrBairro : undefined,
    bairro: bairroMaybe || complementoOrBairro || undefined,
    municipio: municipio || undefined,
    uf: uf || undefined,
    cep: cep ? formatCep(cep) : undefined,
  };
};

const EMPRESAS_QUERY = `
  query EmpresasPage {
    empresas(order_by: { razao_social: asc }) {
      id
      razao_social
      nome_fantasia
      cnpj
      email
      whatsapp
      endereco
      associada
      tipo_vinculo
      categoria_mantenedor
      valor_mensalidade_vinculo
      situacao_financeira
      porte
      capital_social
      desconto_mensalidade_percentual
      faixa_id
      data_fundacao
      data_associacao
      data_desassociacao
      responsaveis {
        id
        nome
        whatsapp
        email
        data_aniversario
        cpf
        contato_principal
      }
      relacionamentos {
        id
        tipo
        categoria
        status
        descricao
        contrapartidas
        observacoes
      }
      colaboradores {
        id
        nome
        cpf
        whatsapp
        cargo
        email
        observacoes
      }
    }
    empresa_socios(order_by: { nome: asc }) {
      id
      empresa_id
      nome
      qualificacao
      pais_origem
      nome_representante_legal
      qualificacao_representante_legal
    }
    empresa_atividades_economicas(order_by: [{ principal: desc }, { codigo: asc }]) {
      id
      empresa_id
      codigo
      descricao
      principal
    }
    faixas(order_by: { min_colaboradores: asc }) {
      id
      label
      min_colaboradores
      max_colaboradores
      valor_mensalidade
    }
    solicitacoes_associacao(
      where: { status: { _in: ["pendente", "em_analise", "aprovado"] } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      status
      cnpj
      razao_social
      nome_fantasia
      email
      whatsapp
      endereco
      porte
      capital_social
      data_fundacao
      qtd_funcionarios
      responsavel_nome
      responsavel_cpf
      responsavel_email
      responsavel_whatsapp
      responsavel_data_nascimento
      payload
      observacoes
      created_at
    }
  }
`;

const Empresas = () => {
  const isMobile = useIsMobile();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [associationFilter, setAssociationFilter] = useState<"Todas" | "Associadas" | "Não associadas">("Todas");
  const [situacaoFilter, setSituacaoFilter] = useState<"Todas" | "Regular" | "Inadimplente">("Todas");
  const [porteFilter, setPorteFilter] = useState<string>("");
  const [faixaFilter, setFaixaFilter] = useState<string>("");
  const [periodoTipo, setPeriodoTipo] = useState<typeof periodoOptions[number]["value"]>("fundacao");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(50);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [associationRecentsExpanded, setAssociationRecentsExpanded] = useState(false);
  const [associationHistoryOpen, setAssociationHistoryOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [editingSolicitacao, setEditingSolicitacao] = useState<SolicitacaoAssociacaoRow | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoAssociacaoRow | null>(null);
  const [solicitacaoFaixaOverrides, setSolicitacaoFaixaOverrides] = useState<Record<string, string>>({});
  const [solicitacoesComFaixaAberta, setSolicitacoesComFaixaAberta] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Empresa>>({ colaboradores: [] });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLookingUpCnpj, setIsLookingUpCnpj] = useState(false);
  const [hasReceitaWsSuggestions, setHasReceitaWsSuggestions] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const lastReceitaWsLookupRef = useRef<string>("");
  const lastCepLookupRef = useRef<string>("");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["empresas-page"],
    queryFn: () =>
      hasuraRequest<{
        empresas: EmpresaRow[];
        empresa_socios: SocioRow[];
        empresa_atividades_economicas: AtividadeEconomicaRow[];
        faixas: FaixaRow[];
        solicitacoes_associacao: SolicitacaoAssociacaoRow[];
      }>({
        query: EMPRESAS_QUERY,
        token,
      }),
  });

  const solicitacoesAssociacao = data?.solicitacoes_associacao ?? [];

  const faixas = useMemo<Faixa[]>(() => {
    return (
      data?.faixas.map((faixa) => ({
        id: faixa.id,
        min: faixa.min_colaboradores ?? 0,
        max: faixa.max_colaboradores ?? 0,
        valor: faixa.valor_mensalidade ?? 0,
        label:
          faixa.label ??
          `${faixa.min_colaboradores ?? 0}–${faixa.max_colaboradores ?? 0} • R$${faixa.valor_mensalidade ?? 0}`,
      })) ?? []
    );
  }, [data?.faixas]);

  const getFaixaByQtdFuncionarios = (qtdFuncionarios?: number | null) => {
    if (qtdFuncionarios === undefined || qtdFuncionarios === null) return undefined;
    const qtd = Number(qtdFuncionarios);
    if (!Number.isFinite(qtd) || qtd < 0) return undefined;

    return faixas.find((faixa) => {
      if (normalizeSearchText(faixa.label).includes("cotista")) return false;
      const { min, max } = getFaixaLimites(faixa);
      return qtd >= min && (max === null || qtd <= max);
    });
  };

  const getSolicitacaoFaixaId = (solicitacao: SolicitacaoAssociacaoRow) => {
    return solicitacaoFaixaOverrides[solicitacao.id] || getFaixaByQtdFuncionarios(solicitacao.qtd_funcionarios)?.id || "";
  };

  const toggleSolicitacaoFaixaSelect = (solicitacaoId: string) => {
    setSolicitacoesComFaixaAberta((prev) =>
      prev.includes(solicitacaoId) ? prev.filter((id) => id !== solicitacaoId) : [...prev, solicitacaoId],
    );
  };

  const empresas = useMemo<Empresa[]>(() => {
    if (!data?.empresas) return [];
    return data.empresas.map((empresa) => {
      const faixaLabel = empresa.faixa_id ? faixas.find((faixa) => faixa.id === empresa.faixa_id)?.label : undefined;
      const responsaveis =
        empresa.responsaveis?.map((responsavel) => ({
          nome: responsavel.nome ?? undefined,
          cpf: responsavel.cpf ?? undefined,
          dataAniversario: responsavel.data_aniversario ?? undefined,
          whatsapp: responsavel.whatsapp ?? undefined,
          email: responsavel.email ?? undefined,
          contatoPrincipal: Boolean(responsavel.contato_principal),
        })) ?? [];
      const responsavel = responsaveis.find((item) => item.contatoPrincipal) ?? responsaveis[0];
      const relacionamentos =
        empresa.relacionamentos?.map((relacionamento) => ({
          id: relacionamento.id,
          tipo: (relacionamento.tipo as TipoRelacionamento) ?? "Parceiro",
          categoria: relacionamento.categoria ?? undefined,
          status: relacionamento.status ?? "Ativo",
          descricao: relacionamento.descricao ?? undefined,
          contrapartidas: relacionamento.contrapartidas ?? undefined,
          observacoes: relacionamento.observacoes ?? undefined,
        })) ?? [];
      const nomeFantasia = getEmpresaDisplayName(empresa);
      const razaoSocial = empresa.razao_social?.trim() || nomeFantasia;
      const enderecoParts = parseEnderecoParts(empresa.endereco);
      return {
        id: empresa.id,
        logoUrl: "",
        razaoSocial,
        nomeFantasia,
        cnpj: empresa.cnpj ?? "",
        email: empresa.email ?? undefined,
        whatsapp: empresa.whatsapp ?? undefined,
        endereco: empresa.endereco ?? undefined,
        ...enderecoParts,
        associado: Boolean(empresa.associada),
        tipoVinculo: empresa.tipo_vinculo ?? (empresa.associada ? "Associado" : undefined),
        categoriaMantenedor: empresa.categoria_mantenedor ?? undefined,
        valorMensalidadeVinculo: empresa.valor_mensalidade_vinculo ?? undefined,
        situacaoFinanceira: empresa.situacao_financeira === "Inadimplente" ? "Inadimplente" : "Regular",
        porte: (empresa.porte as Empresa["porte"]) ?? "ME",
        capitalSocial: empresa.capital_social ?? undefined,
        descontoMensalidadePercentual: Number(empresa.desconto_mensalidade_percentual ?? 0),
        faixaId: empresa.faixa_id ?? undefined,
        faixaLabel,
        dataFundacao: empresa.data_fundacao ?? "",
        dataAssociacao: empresa.data_associacao ?? null,
        dataDesassociacao: empresa.data_desassociacao ?? null,
        responsavel: responsavel ?? null,
        responsaveis,
        relacionamentos,
        socios:
          (data.empresa_socios ?? [])
            .filter((socio) => socio.empresa_id === empresa.id)
            .map((socio) => ({
              id: socio.id,
              nome: socio.nome,
              qualificacao: socio.qualificacao ?? undefined,
              paisOrigem: socio.pais_origem ?? undefined,
              nomeRepresentanteLegal: socio.nome_representante_legal ?? undefined,
              qualificacaoRepresentanteLegal: socio.qualificacao_representante_legal ?? undefined,
            })),
        atividadesEconomicas:
          (data.empresa_atividades_economicas ?? [])
            .filter((atividade) => atividade.empresa_id === empresa.id)
            .map((atividade) => ({
              id: atividade.id,
              codigo: atividade.codigo,
              descricao: atividade.descricao,
              principal: atividade.principal,
            })),
        colaboradores:
          empresa.colaboradores?.map((colaborador) => ({
            nome: colaborador.nome ?? "",
            cpf: colaborador.cpf ?? "",
            whatsapp: colaborador.whatsapp ?? "",
            cargo: colaborador.cargo ?? "",
            email: colaborador.email ?? "",
            observacoes: colaborador.observacoes ?? undefined,
          })) ?? [],
      };
    });
  }, [data?.empresa_atividades_economicas, data?.empresa_socios, data?.empresas, faixas]);

  const empresasPorDataAssociacao = useMemo(() => {
    return empresas
      .filter((empresa) => empresa.associado)
      .sort((a, b) => {
        if (!a.dataAssociacao && !b.dataAssociacao) return a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR");
        if (!a.dataAssociacao) return 1;
        if (!b.dataAssociacao) return -1;
        return b.dataAssociacao.localeCompare(a.dataAssociacao);
      });
  }, [empresas]);

  const empresasAssociadasRecentemente = empresasPorDataAssociacao.slice(0, 6);

  const saveEmpresaMutation = useMutation({
    mutationFn: async (payload: { values: Partial<Empresa>; id?: string | null }) => {
      const enderecoConsolidado = buildEmpresaEndereco(payload.values);
      const input = {
        razao_social: payload.values.razaoSocial ?? "",
        nome_fantasia: payload.values.nomeFantasia ?? "",
        cnpj: payload.values.cnpj ?? "",
        associada: payload.values.dataDesassociacao ? false : (payload.values.associado ?? false),
        tipo_vinculo: payload.values.tipoVinculo ?? (payload.values.associado ? "Associado" : null),
        categoria_mantenedor: payload.values.tipoVinculo === "Mantenedor" ? payload.values.categoriaMantenedor ?? null : null,
        valor_mensalidade_vinculo:
          payload.values.tipoVinculo === "Mantenedor" || payload.values.tipoVinculo === "Parceiro"
            ? payload.values.valorMensalidadeVinculo ?? null
            : null,
        situacao_financeira: payload.values.situacaoFinanceira ?? "Regular",
        porte: payload.values.porte ?? "ME",
        capital_social: payload.values.capitalSocial ?? null,
        desconto_mensalidade_percentual: payload.values.descontoMensalidadePercentual ?? 0,
        faixa_id: payload.values.faixaId ?? null,
        email: payload.values.email ?? null,
        whatsapp: payload.values.whatsapp ?? null,
        endereco: enderecoConsolidado || payload.values.endereco || null,
        data_fundacao: payload.values.dataFundacao ?? null,
        data_associacao: payload.values.dataAssociacao ?? null,
        data_desassociacao: payload.values.dataDesassociacao ?? null,
      };

      const responsaveisBase =
        payload.values.responsaveis?.length
          ? payload.values.responsaveis
          : payload.values.responsavel
            ? [payload.values.responsavel]
            : [];
      const responsavelInput = responsaveisBase
        .filter((responsavel) => responsavel.nome || responsavel.whatsapp || responsavel.email || responsavel.cpf)
        .map((responsavel) => ({
          nome: responsavel.nome ?? "",
          whatsapp: responsavel.whatsapp ?? "",
          email: responsavel.email || null,
          data_aniversario: responsavel.dataAniversario || null,
          cpf: responsavel.cpf || null,
          contato_principal: Boolean(responsavel.contatoPrincipal),
        }));

      const colaboradoresInput =
        payload.values.colaboradores?.filter((colaborador) => colaborador.nome || colaborador.cpf) ?? [];
      const relacionamentosInput =
        payload.values.relacionamentos?.filter((relacionamento) => relacionamento.tipo) ?? [];
      const sociosInput = (payload.values.socios ?? [])
        .filter((socio) => socio.nome.trim())
        .map((socio) => ({
          nome: socio.nome.trim(),
          qualificacao: socio.qualificacao?.trim() || null,
          pais_origem: socio.paisOrigem?.trim() || null,
          nome_representante_legal: socio.nomeRepresentanteLegal?.trim() || null,
          qualificacao_representante_legal: socio.qualificacaoRepresentanteLegal?.trim() || null,
          origem: "receitaws",
        }));
      const atividadesInput = (payload.values.atividadesEconomicas ?? [])
        .filter((atividade) => atividade.codigo.trim() && atividade.descricao.trim())
        .map((atividade) => ({
          codigo: atividade.codigo.trim(),
          descricao: atividade.descricao.trim(),
          principal: atividade.principal,
          origem: "receitaws",
        }));

      if (payload.id) {
        await hasuraRequest({
          query: `
            mutation UpdateEmpresa($id: uuid!, $input: empresas_set_input!) {
              update_empresas_by_pk(pk_columns: { id: $id }, _set: $input) {
                id
              }
            }
          `,
          variables: { id: payload.id, input },
          token,
        });

        await hasuraRequest({
          query: `
            mutation RefreshRelacionados($empresaId: uuid!, $responsaveis: [responsaveis_insert_input!]!, $colaboradores: [colaboradores_insert_input!]!, $relacionamentos: [relacionamentos_insert_input!]!, $socios: [empresa_socios_insert_input!]!, $atividades: [empresa_atividades_economicas_insert_input!]!) {
              delete_responsaveis(where: { empresa_id: { _eq: $empresaId } }) { affected_rows }
              delete_colaboradores(where: { empresa_id: { _eq: $empresaId } }) { affected_rows }
              delete_relacionamentos(where: { empresa_id: { _eq: $empresaId } }) { affected_rows }
              delete_empresa_socios(where: { empresa_id: { _eq: $empresaId } }) { affected_rows }
              delete_empresa_atividades_economicas(where: { empresa_id: { _eq: $empresaId } }) { affected_rows }
              insert_responsaveis(objects: $responsaveis) { affected_rows }
              insert_colaboradores(objects: $colaboradores) { affected_rows }
              insert_relacionamentos(objects: $relacionamentos) { affected_rows }
              insert_empresa_socios(objects: $socios) { affected_rows }
              insert_empresa_atividades_economicas(objects: $atividades) { affected_rows }
            }
          `,
          variables: {
            empresaId: payload.id,
            responsaveis: responsavelInput.map((r) => ({ ...r, empresa_id: payload.id })),
            colaboradores: colaboradoresInput.map((c) => ({ ...c, empresa_id: payload.id })),
            relacionamentos: relacionamentosInput.map((relacionamento) => ({ ...relacionamento, empresa_id: payload.id })),
            socios: sociosInput.map((socio) => ({ ...socio, empresa_id: payload.id })),
            atividades: atividadesInput.map((atividade) => ({ ...atividade, empresa_id: payload.id })),
          },
          token,
        });

        return payload.id;
      }

      const created = await hasuraRequest<{ insert_empresas_one: { id: string } }>({
        query: `
          mutation InsertEmpresa($input: empresas_insert_input!) {
            insert_empresas_one(object: $input) { id }
          }
        `,
        variables: { input },
        token,
      });

      const empresaId = created.insert_empresas_one.id;
      if (responsavelInput.length || colaboradoresInput.length || relacionamentosInput.length || sociosInput.length || atividadesInput.length) {
        await hasuraRequest({
          query: `
            mutation InsertRelacionados($responsaveis: [responsaveis_insert_input!]!, $colaboradores: [colaboradores_insert_input!]!, $relacionamentos: [relacionamentos_insert_input!]!, $socios: [empresa_socios_insert_input!]!, $atividades: [empresa_atividades_economicas_insert_input!]!) {
              insert_responsaveis(objects: $responsaveis) { affected_rows }
              insert_colaboradores(objects: $colaboradores) { affected_rows }
              insert_relacionamentos(objects: $relacionamentos) { affected_rows }
              insert_empresa_socios(objects: $socios) { affected_rows }
              insert_empresa_atividades_economicas(objects: $atividades) { affected_rows }
            }
          `,
          variables: {
            responsaveis: responsavelInput.map((r) => ({ ...r, empresa_id: empresaId })),
            colaboradores: colaboradoresInput.map((c) => ({ ...c, empresa_id: empresaId })),
            relacionamentos: relacionamentosInput.map((relacionamento) => ({ ...relacionamento, empresa_id: empresaId })),
            socios: sociosInput.map((socio) => ({ ...socio, empresa_id: empresaId })),
            atividades: atividadesInput.map((atividade) => ({ ...atividade, empresa_id: empresaId })),
          },
          token,
        });
      }

      return empresaId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["empresas-page"] });
    },
  });

  const saveSolicitacaoMutation = useMutation({
    mutationFn: async ({ solicitacao, values }: { solicitacao: SolicitacaoAssociacaoRow; values: Partial<Empresa> }) => {
      const responsaveis = (values.responsaveis ?? []).filter(
        (responsavel) => responsavel.nome || responsavel.cpf || responsavel.email || responsavel.whatsapp,
      );
      const responsavelPrincipal = responsaveis.find((responsavel) => responsavel.contatoPrincipal) ?? responsaveis[0];
      const endereco = buildEmpresaEndereco(values) || values.endereco || null;
      const payload: SolicitacaoAssociacaoPayload = {
        ...(solicitacao.payload ?? {}),
        responsaveis,
        colaboradores: values.colaboradores ?? [],
        relacionamentos: values.relacionamentos ?? [],
        socios: values.socios ?? [],
        atividadesEconomicas: values.atividadesEconomicas ?? [],
        enderecoDetalhado: {
          cep: values.cep,
          logradouro: values.logradouro,
          numero: values.numero,
          complemento: values.complemento,
          bairro: values.bairro,
          municipio: values.municipio,
          uf: values.uf,
        },
      };

      await hasuraRequest({
        query: `
          mutation AtualizarSolicitacao($id: uuid!, $input: solicitacoes_associacao_set_input!) {
            update_solicitacoes_associacao_by_pk(pk_columns: { id: $id }, _set: $input) {
              id
              status
            }
          }
        `,
        variables: {
          id: solicitacao.id,
          input: {
            cnpj: values.cnpj ?? "",
            razao_social: values.razaoSocial?.trim() ?? "",
            nome_fantasia: values.nomeFantasia?.trim() || null,
            email: values.email?.trim().toLowerCase() || null,
            whatsapp: values.whatsapp || null,
            endereco,
            porte: values.porte || null,
            capital_social: values.capitalSocial ?? null,
            data_fundacao: values.dataFundacao || null,
            qtd_funcionarios: values.qtdFuncionarios ?? null,
            responsavel_nome: responsavelPrincipal?.nome?.trim() || null,
            responsavel_cpf: responsavelPrincipal?.cpf || null,
            responsavel_email: responsavelPrincipal?.email?.trim().toLowerCase() || null,
            responsavel_whatsapp: responsavelPrincipal?.whatsapp || null,
            responsavel_data_nascimento: responsavelPrincipal?.dataAniversario || null,
            observacoes: values.observacoesSolicitacao?.trim() || null,
            payload,
          },
        },
        token,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["empresas-page"] });
    },
  });

  const approveSolicitacaoMutation = useMutation({
    mutationFn: async (solicitacao: SolicitacaoAssociacaoRow) => {
      const payload = solicitacao.payload ?? {};
      const responsaveisFromPayload = payload.responsaveis ?? [];
      const responsaveis: Responsavel[] = responsaveisFromPayload.length
        ? responsaveisFromPayload
        : [
            {
              nome: solicitacao.responsavel_nome ?? "",
              cpf: solicitacao.responsavel_cpf ?? "",
              dataAniversario: solicitacao.responsavel_data_nascimento ?? "",
              whatsapp: solicitacao.responsavel_whatsapp ?? "",
              email: solicitacao.responsavel_email ?? "",
              contatoPrincipal: true,
            },
          ];

      const empresaInput = {
        razao_social: solicitacao.razao_social,
        nome_fantasia: solicitacao.nome_fantasia || solicitacao.razao_social,
        cnpj: solicitacao.cnpj,
        tipo_vinculo: "Associado",
        associada: true,
        situacao_financeira: "Regular",
        porte: solicitacao.porte || "ME",
        capital_social: solicitacao.capital_social ?? null,
        desconto_mensalidade_percentual: 0,
        faixa_id: getSolicitacaoFaixaId(solicitacao) || null,
        email: solicitacao.email || solicitacao.responsavel_email || null,
        whatsapp: solicitacao.whatsapp || solicitacao.responsavel_whatsapp || null,
        endereco: solicitacao.endereco || null,
        data_fundacao: solicitacao.data_fundacao || null,
        data_associacao: new Date().toISOString().slice(0, 10),
      };

      const created = await hasuraRequest<{ insert_empresas_one: { id: string } }>({
        query: `
          mutation AprovarSolicitacaoEmpresa($input: empresas_insert_input!) {
            insert_empresas_one(object: $input) { id }
          }
        `,
        variables: { input: empresaInput },
        token,
      });

      const empresaId = created.insert_empresas_one.id;
      const responsaveisInput = responsaveis
        .filter((responsavel) => responsavel.nome || responsavel.whatsapp || responsavel.email || responsavel.cpf)
        .map((responsavel, index) => ({
          empresa_id: empresaId,
          nome: responsavel.nome ?? "",
          whatsapp: responsavel.whatsapp ?? "",
          email: responsavel.email || null,
          data_aniversario: responsavel.dataAniversario || null,
          cpf: responsavel.cpf || null,
          contato_principal: responsavel.contatoPrincipal ?? index === 0,
        }));
      const colaboradoresInput = (payload.colaboradores ?? [])
        .filter((colaborador) => colaborador.nome || colaborador.cpf)
        .map((colaborador) => ({ ...colaborador, empresa_id: empresaId }));
      const relacionamentosInput = (payload.relacionamentos ?? [])
        .filter((relacionamento) => relacionamento.tipo)
        .map((relacionamento) => ({ ...relacionamento, empresa_id: empresaId }));
      const sociosInput = (payload.socios ?? [])
        .filter((socio) => socio.nome?.trim())
        .map((socio) => ({
          empresa_id: empresaId,
          nome: socio.nome.trim(),
          qualificacao: socio.qualificacao?.trim() || null,
          pais_origem: socio.paisOrigem?.trim() || null,
          nome_representante_legal: socio.nomeRepresentanteLegal?.trim() || null,
          qualificacao_representante_legal: socio.qualificacaoRepresentanteLegal?.trim() || null,
          origem: "receitaws",
        }));
      const atividadesInput = (payload.atividadesEconomicas ?? [])
        .filter((atividade) => atividade.codigo?.trim() && atividade.descricao?.trim())
        .map((atividade) => ({
          empresa_id: empresaId,
          codigo: atividade.codigo.trim(),
          descricao: atividade.descricao.trim(),
          principal: Boolean(atividade.principal),
          origem: "receitaws",
        }));

      await hasuraRequest({
        query: `
          mutation FinalizarSolicitacao(
            $solicitacaoId: uuid!
            $responsaveis: [responsaveis_insert_input!]!
            $colaboradores: [colaboradores_insert_input!]!
            $relacionamentos: [relacionamentos_insert_input!]!
            $socios: [empresa_socios_insert_input!]!
            $atividades: [empresa_atividades_economicas_insert_input!]!
            $empresaId: uuid!
            $aprovadoEm: timestamptz!
          ) {
            insert_responsaveis(objects: $responsaveis) { affected_rows }
            insert_colaboradores(objects: $colaboradores) { affected_rows }
            insert_relacionamentos(objects: $relacionamentos) { affected_rows }
            insert_empresa_socios(objects: $socios) { affected_rows }
            insert_empresa_atividades_economicas(objects: $atividades) { affected_rows }
            update_solicitacoes_associacao_by_pk(
              pk_columns: { id: $solicitacaoId }
              _set: { status: "convertido", empresa_id: $empresaId, aprovado_em: $aprovadoEm }
            ) { id status empresa_id }
          }
        `,
        variables: {
          solicitacaoId: solicitacao.id,
          responsaveis: responsaveisInput,
          colaboradores: colaboradoresInput,
          relacionamentos: relacionamentosInput,
          socios: sociosInput,
          atividades: atividadesInput,
          empresaId,
          aprovadoEm: new Date().toISOString(),
        },
        token,
      });
    },
    onSuccess: async (_data, solicitacao) => {
      setSolicitacaoFaixaOverrides((prev) => {
        const next = { ...prev };
        delete next[solicitacao.id];
        return next;
      });
      setSolicitacoesComFaixaAberta((prev) => prev.filter((id) => id !== solicitacao.id));
      await queryClient.invalidateQueries({ queryKey: ["empresas-page"] });
    },
  });

  const rejectSolicitacaoMutation = useMutation({
    mutationFn: async (solicitacaoId: string) => {
      await hasuraRequest({
        query: `
          mutation RecusarSolicitacao($id: uuid!, $recusadoEm: timestamptz!) {
            update_solicitacoes_associacao_by_pk(
              pk_columns: { id: $id }
              _set: { status: "recusado", recusado_em: $recusadoEm }
            ) { id status }
          }
        `,
        variables: { id: solicitacaoId, recusadoEm: new Date().toISOString() },
        token,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["empresas-page"] });
    },
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (empresaId: string) => {
      await hasuraRequest({
        query: `
          mutation DeleteEmpresa($id: uuid!) {
            delete_empresas_by_pk(id: $id) { id }
          }
        `,
        variables: { id: empresaId },
        token,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["empresas-page"] });
    },
  });

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
      const search = normalizeSearchText(searchTerm.trim());
      const searchTokens = search.split(/\s+/).filter(Boolean);
      const empresaSearchBlob = normalizeSearchText([
        empresa.razaoSocial,
        empresa.nomeFantasia,
        empresa.responsavel?.nome,
        ...empresa.responsaveis.map((responsavel) => [responsavel.nome, responsavel.cpf, responsavel.email].filter(Boolean).join(" ")),
        ...empresa.colaboradores.map((colaborador) => colaborador.nome),
      ].join(" "));
      const cnpjDigits = empresa.cnpj.replace(/\D/g, "");
      const searchDigits = search.replace(/\D/g, "");
      const matchesSearch =
        !search ||
        searchTokens.every((token) => empresaSearchBlob.includes(token)) ||
        (!!searchDigits && cnpjDigits.includes(searchDigits));

      const matchesAssociacao =
        associationFilter === "Todas" ||
        (associationFilter === "Associadas" && empresa.associado) ||
        (associationFilter === "Não associadas" && !empresa.associado);

      const matchesSituacao = situacaoFilter === "Todas" || empresa.situacaoFinanceira === situacaoFilter;
      const matchesPorte = !porteFilter || empresa.porte === porteFilter;
      const matchesFaixa = !faixaFilter || (faixaFilter === "sem-faixa" ? !empresa.faixaId : empresa.faixaId === faixaFilter);

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
  const paginatedEmpresas = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredEmpresas.slice(start, start + tablePageSize);
  }, [filteredEmpresas, tablePage, tablePageSize]);

  const handleExportEmpresas = async (type: "PDF" | "Excel") => {
    if (type === "PDF") {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Empresa", "CNPJ", "Associada", "Situação"]],
        body: filteredEmpresas.map((empresa) => [
          empresa.nomeFantasia,
          empresa.cnpj,
          empresa.associado ? "Sim" : "Não",
          empresa.situacaoFinanceira,
        ]),
      });
      doc.save("empresas.pdf");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Empresas");
    worksheet.addRow(["Empresa", "CNPJ", "Associada", "Situação"]);
    filteredEmpresas.forEach((empresa) => {
      worksheet.addRow([
        empresa.nomeFantasia,
        empresa.cnpj,
        empresa.associado ? "Sim" : "Não",
        empresa.situacaoFinanceira,
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "empresas.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenDialog = (empresa?: Empresa, viewMode = false) => {
    lastReceitaWsLookupRef.current = "";
    lastCepLookupRef.current = "";
    setEditingSolicitacao(null);
    setValidationErrors([]);
    setHasReceitaWsSuggestions(false);
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
        responsaveis: empresa.responsaveis.length
          ? empresa.responsaveis.map((responsavel) => ({ ...responsavel }))
          : [{ nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false }],
        relacionamentos: empresa.relacionamentos.length ? empresa.relacionamentos.map((relacionamento) => ({ ...relacionamento })) : [],
        socios: empresa.socios.map((socio) => ({ ...socio })),
        atividadesEconomicas: empresa.atividadesEconomicas.map((atividade) => ({ ...atividade })),
        responsavel: empresa.responsavel ? { ...empresa.responsavel } : { nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false },
      });
      setLogoPreview(empresa.logoUrl);
    } else {
      setEditingEmpresa(null);
      setFormData({
        associado: true,
        tipoVinculo: "Associado",
        situacaoFinanceira: "Regular",
        porte: "ME",
        descontoMensalidadePercentual: 0,
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        municipio: "",
        uf: "",
        colaboradores: [{ nome: "", cpf: "", whatsapp: "", cargo: "", email: "" }],
        responsaveis: [{ nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false }],
        relacionamentos: [],
        socios: [],
        atividadesEconomicas: [],
        responsavel: { nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false },
      });
      setLogoPreview("");
    }
    setIsDialogOpen(true);
  };

  const handleOpenSolicitacaoEditor = (solicitacao: SolicitacaoAssociacaoRow) => {
    const payload = solicitacao.payload ?? {};
    const enderecoParts = {
      ...parseEnderecoParts(solicitacao.endereco),
      ...(payload.enderecoDetalhado ?? {}),
    };
    const responsaveis = payload.responsaveis?.length
      ? payload.responsaveis.map((responsavel) => ({ ...responsavel }))
      : [{
          nome: solicitacao.responsavel_nome ?? "",
          cpf: solicitacao.responsavel_cpf ?? "",
          email: solicitacao.responsavel_email ?? "",
          whatsapp: solicitacao.responsavel_whatsapp ?? "",
          dataAniversario: solicitacao.responsavel_data_nascimento ?? "",
          contatoPrincipal: true,
        }];

    setSelectedSolicitacao(null);
    setEditingEmpresa(null);
    setEditingSolicitacao(solicitacao);
    setIsViewMode(false);
    setValidationErrors([]);
    setHasReceitaWsSuggestions(false);
    setFormData({
      razaoSocial: solicitacao.razao_social,
      nomeFantasia: solicitacao.nome_fantasia ?? "",
      cnpj: solicitacao.cnpj,
      email: solicitacao.email ?? "",
      whatsapp: solicitacao.whatsapp ?? "",
      endereco: solicitacao.endereco ?? undefined,
      ...enderecoParts,
      associado: true,
      tipoVinculo: "Associado",
      situacaoFinanceira: "Regular",
      porte: (solicitacao.porte as Empresa["porte"]) || "ME",
      capitalSocial: solicitacao.capital_social ?? undefined,
      faixaId: getSolicitacaoFaixaId(solicitacao) || undefined,
      dataFundacao: solicitacao.data_fundacao ?? "",
      responsaveis,
      responsavel: responsaveis.find((responsavel) => responsavel.contatoPrincipal) ?? responsaveis[0],
      colaboradores: payload.colaboradores?.map((colaborador) => ({ ...colaborador })) ?? [],
      relacionamentos: payload.relacionamentos?.map((relacionamento) => ({ ...relacionamento })) ?? [],
      socios: payload.socios?.map((socio) => ({ ...socio })) ?? [],
      atividadesEconomicas: payload.atividadesEconomicas?.map((atividade) => ({ ...atividade })) ?? [],
      qtdFuncionarios: solicitacao.qtd_funcionarios ?? undefined,
      observacoesSolicitacao: solicitacao.observacoes ?? "",
    });
    setLogoPreview("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    lastReceitaWsLookupRef.current = "";
    lastCepLookupRef.current = "";
    setIsDialogOpen(false);
    setEditingEmpresa(null);
    setEditingSolicitacao(null);
    setIsViewMode(false);
    setFormData({ colaboradores: [], responsaveis: [], relacionamentos: [], socios: [], atividadesEconomicas: [] });
    setLogoPreview("");
    setValidationErrors([]);
    setHasReceitaWsSuggestions(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const empresaId = searchParams.get("editar");
    if (!empresaId || !empresas.length) return;

    const empresa = empresas.find((item) => item.id === empresaId);
    if (empresa) {
      handleOpenDialog(empresa, false);
    } else {
      toast({
        title: "Empresa não encontrada",
        description: "Não foi possível abrir os dados completos desta empresa.",
        variant: "destructive",
      });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("editar");
    setSearchParams(nextParams, { replace: true });
  }, [empresas, searchParams, setSearchParams, toast]);

  const clearValidationError = (field: string) => {
    setValidationErrors((prev) => prev.filter((item) => item !== field));
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

  const addResponsavel = () => {
    setFormData((prev) => ({
      ...prev,
      responsaveis: [
        ...(prev.responsaveis || []),
        { nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false },
      ],
    }));
  };

  const removeResponsavel = (index: number) => {
    setFormData((prev) => {
      const responsaveis = [...(prev.responsaveis || [])];
      responsaveis.splice(index, 1);
      return { ...prev, responsaveis };
    });
  };

  const updateResponsavel = (index: number, field: keyof Responsavel, value: string | boolean) => {
    setFormData((prev) => {
      const responsaveis = [...(prev.responsaveis || [])];
      const current = responsaveis[index] || {};
      const formattedValue =
        field === "cpf" && typeof value === "string"
          ? formatCpf(value)
          : field === "whatsapp" && typeof value === "string"
            ? formatPhone(value)
            : value;

      const nextResponsaveis = responsaveis.map((responsavel, responsavelIndex) => {
        if (field === "contatoPrincipal" && value === true) {
          return {
            ...responsavel,
            contatoPrincipal: responsavelIndex === index,
          };
        }
        return responsavelIndex === index ? { ...current, [field]: formattedValue } : responsavel;
      });

      if (!nextResponsaveis[index]) {
        nextResponsaveis[index] = { ...current, [field]: formattedValue };
      }

      return {
        ...prev,
        responsaveis: nextResponsaveis,
        responsavel: nextResponsaveis.find((responsavel) => responsavel.contatoPrincipal) ?? nextResponsaveis[0],
      };
    });
  };

  const addSocio = () => {
    setFormData((prev) => ({
      ...prev,
      socios: [...(prev.socios || []), { nome: "", qualificacao: "" }],
    }));
  };

  const updateSocio = (index: number, field: keyof SocioEmpresa, value: string) => {
    setFormData((prev) => {
      const socios = [...(prev.socios || [])];
      socios[index] = { ...socios[index], [field]: value };
      return { ...prev, socios };
    });
  };

  const removeSocio = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socios: (prev.socios || []).filter((_, socioIndex) => socioIndex !== index),
    }));
  };

  const addAtividadeEconomica = () => {
    setFormData((prev) => ({
      ...prev,
      atividadesEconomicas: [
        ...(prev.atividadesEconomicas || []),
        { codigo: "", descricao: "", principal: !(prev.atividadesEconomicas || []).some((atividade) => atividade.principal) },
      ],
    }));
  };

  const updateAtividadeEconomica = (index: number, field: keyof AtividadeEconomica, value: string | boolean) => {
    setFormData((prev) => {
      const atividades = (prev.atividadesEconomicas || []).map((atividade, atividadeIndex) => {
        if (field === "principal" && value === true) {
          return { ...atividade, principal: atividadeIndex === index };
        }
        return atividadeIndex === index ? { ...atividade, [field]: value } : atividade;
      });
      return { ...prev, atividadesEconomicas: atividades };
    });
  };

  const removeAtividadeEconomica = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      atividadesEconomicas: (prev.atividadesEconomicas || []).filter((_, atividadeIndex) => atividadeIndex !== index),
    }));
  };

  const addRelacionamento = () => {
    setFormData((prev) => ({
      ...prev,
      relacionamentos: [
        ...(prev.relacionamentos || []),
        { tipo: "Parceiro", status: "Ativo", categoria: "", descricao: "", contrapartidas: "", observacoes: "" },
      ],
    }));
  };

  const removeRelacionamento = (index: number) => {
    setFormData((prev) => {
      const relacionamentos = [...(prev.relacionamentos || [])];
      relacionamentos.splice(index, 1);
      return { ...prev, relacionamentos };
    });
  };

  const updateRelacionamento = (index: number, field: keyof RelacionamentoEmpresa, value: string) => {
    setFormData((prev) => {
      const relacionamentos = [...(prev.relacionamentos || [])];
      const current = relacionamentos[index] || { tipo: "Parceiro", status: "Ativo" };
      const next = { ...current, [field]: value } as RelacionamentoEmpresa;

      if (field === "tipo") {
        const tipo = value as TipoRelacionamento;
        next.tipo = tipo;
        next.status = relacionamentoStatusOptions[tipo][0];
        next.categoria = "";
        next.descricao = "";
        next.contrapartidas = "";
        next.observacoes = "";
      }

      relacionamentos[index] = next;
      return { ...prev, relacionamentos };
    });
  };

  const handleFaixaChange = (value: string) => {
    if (!value || value === "none") {
      setFormData((prev) => ({ ...prev, faixaId: undefined, faixaLabel: undefined }));
      return;
    }
    const faixaSelecionada = faixas.find((faixa) => faixa.id === value);
    setFormData((prev) => ({ ...prev, faixaId: value, faixaLabel: faixaSelecionada?.label }));
  };

  const applyReceitaWsData = (payload: ReceitaWsResponse, cnpj: string) => {
    const porte = normalizeReceitaWsPorte(payload.porte);
    const capitalSocial = parseReceitaWsCapital(payload.capital_social);
    const dataFundacao = parseReceitaWsDate(payload.abertura);
    const socios = (payload.qsa ?? [])
      .filter((socio) => socio.nome?.trim())
      .map((socio) => ({
        nome: socio.nome!.trim(),
        qualificacao: socio.qual?.trim() || undefined,
        paisOrigem: socio.pais_origem?.trim() || undefined,
        nomeRepresentanteLegal: socio.nome_rep_legal?.trim() || undefined,
        qualificacaoRepresentanteLegal: socio.qual_rep_legal?.trim() || undefined,
      }));
    const atividadesEconomicas = [
      ...(payload.atividade_principal ?? []).map((atividade) => ({ ...atividade, principal: true })),
      ...(payload.atividades_secundarias ?? []).map((atividade) => ({ ...atividade, principal: false })),
    ]
      .filter((atividade) => atividade.code?.trim() && atividade.text?.trim())
      .map((atividade) => ({
        codigo: atividade.code!.trim(),
        descricao: atividade.text!.trim(),
        principal: atividade.principal,
      }));

    setFormData((prev) => {
      const nextAddress = {
        ...prev,
        cep: payload.cep ? formatCep(payload.cep) : prev.cep,
        logradouro: payload.logradouro?.trim() || prev.logradouro,
        numero: payload.numero?.trim() || prev.numero,
        complemento: payload.complemento?.trim() || prev.complemento,
        bairro: payload.bairro?.trim() || prev.bairro,
        municipio: payload.municipio?.trim() || prev.municipio,
        uf: payload.uf?.trim() || prev.uf,
      };

      return {
        ...nextAddress,
        cnpj: formatCnpj(payload.cnpj || cnpj),
        razaoSocial: payload.nome?.trim() || prev.razaoSocial,
        nomeFantasia: payload.fantasia?.trim() || prev.nomeFantasia || payload.nome?.trim(),
        email: payload.email?.trim().toLowerCase() || prev.email,
        whatsapp: payload.telefone ? formatPhone(payload.telefone) : prev.whatsapp,
        endereco: buildEmpresaEndereco(nextAddress) || prev.endereco,
        porte: porte || prev.porte,
        capitalSocial: capitalSocial ?? prev.capitalSocial,
        dataFundacao: dataFundacao || prev.dataFundacao,
        socios: socios.length ? socios : prev.socios,
        atividadesEconomicas: atividadesEconomicas.length ? atividadesEconomicas : prev.atividadesEconomicas,
      };
    });
    setHasReceitaWsSuggestions(true);
    setValidationErrors((prev) => prev.filter((field) => !["razaoSocial", "cnpj", "porte", "dataFundacao"].includes(field)));
  };

  const handleReceitaWsLookup = async (cnpjValue = formData.cnpj || "", options?: { silent?: boolean }) => {
    const cnpjDigits = cnpjValue.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      if (!options?.silent) {
        toast({
          title: "CNPJ incompleto",
          description: "Informe os 14 dígitos do CNPJ para buscar na ReceitaWS.",
          variant: "destructive",
        });
      }
      return;
    }

    if (isLookingUpCnpj || (options?.silent && lastReceitaWsLookupRef.current === cnpjDigits)) return;

    try {
      setIsLookingUpCnpj(true);
      lastReceitaWsLookupRef.current = cnpjDigits;
      const response = await fetch(buildReceitaWsRequestUrl(cnpjDigits));
      const payload = (await response.json()) as ReceitaWsResponse;

      if (!response.ok || payload.status === "ERROR") {
        throw new Error(payload.message || "Não foi possível consultar esse CNPJ na ReceitaWS.");
      }

      applyReceitaWsData(payload, cnpjDigits);
      toast({
        title: "Dados localizados",
        description: "Os dados da ReceitaWS foram aplicados como sugestões e podem ser alterados.",
      });
    } catch (err) {
      if (!options?.silent) {
        toast({
          title: "Falha ao consultar CNPJ",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLookingUpCnpj(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    const formattedCnpj = formatCnpj(value);
    clearValidationError("cnpj");
    setFormData((prev) => ({ ...prev, cnpj: formattedCnpj }));

    const digits = formattedCnpj.replace(/\D/g, "");
    if (!isViewMode && digits.length === 14 && lastReceitaWsLookupRef.current !== digits) {
      void handleReceitaWsLookup(formattedCnpj, { silent: true });
    }
  };

  const applyViaCepData = (payload: ViaCepResponse) => {
    setFormData((prev) => {
      const nextAddress = {
        ...prev,
        cep: payload.cep ? formatCep(payload.cep) : prev.cep,
        logradouro: payload.logradouro?.trim() || prev.logradouro,
        complemento: payload.complemento?.trim() || prev.complemento,
        bairro: payload.bairro?.trim() || prev.bairro,
        municipio: payload.localidade?.trim() || prev.municipio,
        uf: payload.uf?.trim() || prev.uf,
      };

      return {
        ...nextAddress,
        endereco: buildEmpresaEndereco(nextAddress) || prev.endereco,
      };
    });
  };

  const handleCepLookup = async (cepValue = formData.cep || "", options?: { silent?: boolean }) => {
    const cepDigits = cepValue.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      if (!options?.silent) {
        toast({
          title: "CEP incompleto",
          description: "Informe os 8 dígitos do CEP para buscar o endereço.",
          variant: "destructive",
        });
      }
      return;
    }

    if (isLookingUpCep || (options?.silent && lastCepLookupRef.current === cepDigits)) return;

    try {
      setIsLookingUpCep(true);
      lastCepLookupRef.current = cepDigits;
      const response = await fetch(`${VIA_CEP_BASE_URL}/${cepDigits}/json/`);
      const payload = (await response.json()) as ViaCepResponse;

      if (!response.ok || payload.erro) {
        throw new Error("CEP não encontrado na ViaCEP.");
      }

      applyViaCepData(payload);
      if (!options?.silent) {
        toast({
          title: "Endereço localizado",
          description: "Preenchi os dados disponíveis para o CEP informado.",
        });
      }
    } catch (err) {
      if (!options?.silent) {
        toast({
          title: "Falha ao consultar CEP",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formattedCep = formatCep(value);
    setFormData((prev) => ({ ...prev, cep: formattedCep }));

    const digits = formattedCep.replace(/\D/g, "");
    if (!isViewMode && digits.length === 8 && lastCepLookupRef.current !== digits) {
      void handleCepLookup(formattedCep, { silent: true });
    }
  };

  const handleSave = () => {
    const requiredChecks = [
      { key: "razaoSocial", label: "Razão Social", value: formData.razaoSocial },
      { key: "cnpj", label: "CNPJ", value: formData.cnpj },
      { key: "tipoVinculo", label: "Tipo de vínculo", value: formData.tipoVinculo },
      ...(formData.tipoVinculo === "Mantenedor"
        ? [{ key: "categoriaMantenedor", label: "Categoria do mantenedor", value: formData.categoriaMantenedor }]
        : []),
      ...(formData.tipoVinculo === "Mantenedor" || formData.tipoVinculo === "Parceiro"
        ? [{ key: "valorMensalidadeVinculo", label: "Valor mensal negociado", value: (formData.valorMensalidadeVinculo ?? 0) > 0 ? "ok" : "" }]
        : []),
      { key: "situacaoFinanceira", label: "Situação Financeira", value: formData.situacaoFinanceira },
      { key: "porte", label: "Porte", value: formData.porte },
    ];
    const missing = requiredChecks.filter((field) => field.value === undefined || field.value === "");

    if (missing.length > 0) {
      setValidationErrors(missing.map((field) => field.key));
      toast({
        title: "Preencha os campos obrigatórios",
        description: `Faltando: ${missing.map((field) => field.label).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    setValidationErrors([]);

    if (editingSolicitacao) {
      saveSolicitacaoMutation.mutate(
        { solicitacao: editingSolicitacao, values: formData },
        {
          onSuccess: () => {
            setSolicitacaoFaixaOverrides((prev) => ({
              ...prev,
              [editingSolicitacao.id]: formData.faixaId || "",
            }));
            toast({
              title: "Solicitação atualizada",
              description: "As alterações foram salvas e serão usadas na aprovação.",
            });
            handleCloseDialog();
          },
          onError: (err) => {
            toast({
              title: "Não foi possível atualizar a solicitação",
              description: err instanceof Error ? err.message : "Tente novamente em instantes.",
              variant: "destructive",
            });
          },
        },
      );
      return;
    }

    saveEmpresaMutation.mutate(
      { values: formData, id: editingEmpresa?.id ?? null },
      {
        onSuccess: () => {
          toast({
            title: "Empresa atualizada com sucesso",
            description: "As informações foram registradas corretamente.",
          });
          handleCloseDialog();
        },
        onError: (err) => {
          toast({
            title: "Não foi possível salvar a empresa",
            description: err instanceof Error ? err.message : "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDelete = (empresa: Empresa) => {
    setEmpresaToDelete(empresa);
  };

  const confirmDelete = () => {
    if (!empresaToDelete) return;
    deleteEmpresaMutation.mutate(empresaToDelete.id, {
      onSuccess: () => {
        toast({
          title: "Empresa excluída",
          description: "Registro removido com sucesso.",
          variant: "destructive",
        });
        setEmpresaToDelete(null);
      },
      onError: (err) => {
        toast({
          title: "Falha ao excluir empresa",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      },
    });
  };

  const getContatoPrincipal = (empresa: Empresa) => {
    const responsavelPrincipal = empresa.responsaveis.find((responsavel) => responsavel.contatoPrincipal);
    if (responsavelPrincipal?.nome) {
      return {
        nome: responsavelPrincipal.nome,
        whatsapp: responsavelPrincipal.whatsapp || "—",
      };
    }

    const colaboradorContato = empresa.colaboradores.find((colaborador) => colaborador.nome || colaborador.whatsapp);
    if (colaboradorContato) {
      return {
        nome: colaboradorContato.nome || "Colaborador sem nome",
        whatsapp: colaboradorContato.whatsapp || "—",
      };
    }

    const primeiroResponsavel = empresa.responsaveis.find((responsavel) => responsavel.nome || responsavel.whatsapp);
    if (primeiroResponsavel) {
      return {
        nome: primeiroResponsavel.nome || "Responsável sem nome",
        whatsapp: primeiroResponsavel.whatsapp || "—",
      };
    }

    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-neutral-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1C1C1C]">Empresas</h1>
                <p className="text-sm text-muted-foreground">Gestão de associadas, status financeiro e equipes</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 text-xs sm:w-auto" asChild>
                  <Link to="/cadastro-associado" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Cadastro público
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleExportEmpresas("PDF")}>
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleExportEmpresas("Excel")}>
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </Button>
                <Button onClick={() => handleOpenDialog()} className="bg-[#1C1C1C] hover:bg-[#1C1C1C]/90 w-full sm:w-auto" aria-label="Cadastrar nova empresa">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Empresa
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="rounded-xl border border-dashed border-[#CBD5B1] bg-white p-4 text-sm text-muted-foreground">
                Carregando empresas do Hasura...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Erro ao carregar empresas."}
              </div>
            )}

            {!isLoading && !error && (
              <Card className="w-full overflow-hidden border-[#DCE7CB] bg-white shadow-sm lg:ml-auto lg:max-w-md">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 bg-[#F7F8F4] px-4 py-3 text-left transition hover:bg-[#EEF2E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7E8C5E]"
                  onClick={() => setAssociationRecentsExpanded((current) => !current)}
                  aria-expanded={associationRecentsExpanded}
                  aria-controls="ultimas-empresas-associadas"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="rounded-full bg-[#DCE7CB] p-1.5 text-[#1C1C1C]">
                      <History className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#1C1C1C]">Últimas associadas</span>
                      <span className="block text-xs text-muted-foreground">
                        {empresasPorDataAssociacao.length} empresa(s) associada(s)
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#1C1C1C]">
                    {associationRecentsExpanded ? "Minimizar" : "Ver lista"}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", associationRecentsExpanded && "rotate-180")} />
                  </span>
                </button>
                {associationRecentsExpanded && (
                  <CardContent id="ultimas-empresas-associadas" className="p-0">
                    {empresasAssociadasRecentemente.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">Nenhuma empresa associada foi encontrada.</p>
                    ) : (
                      <div className="divide-y divide-[#E9EDDF]">
                        {empresasAssociadasRecentemente.map((empresa, index) => (
                          <button
                            key={empresa.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#FBFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7E8C5E]"
                            onClick={() => handleOpenDialog(empresa, true)}
                          >
                            <span className="w-5 shrink-0 text-center text-xs font-semibold text-[#7E8C5E]">{index + 1}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-[#1C1C1C]">
                                {empresa.nomeFantasia || empresa.razaoSocial}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                              <Clock3 className="h-3.5 w-3.5 text-[#7E8C5E]" />
                              {getAssociationDuration(empresa.dataAssociacao)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="border-t bg-[#FBFCF8] p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => setAssociationHistoryOpen(true)}
                        disabled={empresasPorDataAssociacao.length === 0}
                      >
                        Ver ordem completa
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {solicitacoesAssociacao.length > 0 && (
              <Card className="overflow-hidden border-[#DCE7CB] bg-white shadow-sm">
                <CardHeader className="border-b bg-[#F7F8F4]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-[#DCE7CB] p-2 text-[#1C1C1C]">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-[#1C1C1C]">Solicitações públicas de associação</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Revise os cadastros enviados pelo formulário público antes de converter em empresa associada.
                        </p>
                      </div>
                    </div>
                    <Badge className="w-fit bg-[#7E8C5E] text-white">
                      {solicitacoesAssociacao.length} pendente(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {solicitacoesAssociacao.map((solicitacao) => {
                    const faixaSugerida = getFaixaByQtdFuncionarios(solicitacao.qtd_funcionarios);
                    const faixaSelecionadaId = getSolicitacaoFaixaId(solicitacao);
                    const faixaSelecionada = faixas.find((faixa) => faixa.id === faixaSelecionadaId);
                    const deveExibirSelectFaixa = !faixaSugerida || solicitacoesComFaixaAberta.includes(solicitacao.id);

                    return (
                      <div key={solicitacao.id} className="flex flex-col gap-3 rounded-xl border border-[#DCE7CB] bg-[#FBFCF8] p-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#1C1C1C]">{solicitacao.nome_fantasia || solicitacao.razao_social}</h3>
                          <Badge variant="outline" className="capitalize">{solicitacao.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{solicitacao.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{solicitacao.cnpj}</p>
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span><strong className="text-[#1C1C1C]">Responsável:</strong> {solicitacao.responsavel_nome || "—"}</span>
                        <span><strong className="text-[#1C1C1C]">Contato:</strong> {solicitacao.responsavel_whatsapp || solicitacao.whatsapp || "—"}</span>
                        <span><strong className="text-[#1C1C1C]">E-mail:</strong> {solicitacao.responsavel_email || solicitacao.email || "—"}</span>
                        <span><strong className="text-[#1C1C1C]">Funcionários:</strong> {solicitacao.qtd_funcionarios ?? "—"}</span>
                        <span><strong className="text-[#1C1C1C]">Faixa na aprovação:</strong> {faixaSelecionada?.label || "Sem faixa definida"}</span>
                        <span><strong className="text-[#1C1C1C]">Enviada em:</strong> {formatDate(solicitacao.created_at)}</span>
                      </div>
                      <div className="rounded-lg border border-[#DCE7CB] bg-white p-3 text-xs">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-[#1C1C1C]">Faixa sugerida</p>
                            <p className="text-muted-foreground">
                              {faixaSugerida
                                ? `${faixaSugerida.label} baseada em ${solicitacao.qtd_funcionarios ?? 0} funcionário(s).`
                                : "Nenhuma faixa encontrada para a quantidade de funcionários informada."}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => toggleSolicitacaoFaixaSelect(solicitacao.id)}
                          >
                            {deveExibirSelectFaixa ? "Ocultar seleção" : "Editar faixa"}
                          </Button>
                        </div>
                        {deveExibirSelectFaixa && (
                          <div className="mt-3 space-y-2">
                            <Label htmlFor={`faixa-solicitacao-${solicitacao.id}`}>Selecionar faixa manualmente</Label>
                            <Select
                              value={faixaSelecionadaId || "none"}
                              onValueChange={(value) =>
                                setSolicitacaoFaixaOverrides((prev) => ({
                                  ...prev,
                                  [solicitacao.id]: value === "none" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger id={`faixa-solicitacao-${solicitacao.id}`}>
                                <SelectValue placeholder="Selecione uma faixa" />
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
                        )}
                      </div>
                      {solicitacao.observacoes && (
                        <p className="rounded-lg bg-white p-2 text-xs text-muted-foreground">{solicitacao.observacoes}</p>
                      )}
                      <div className="mt-auto grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelectedSolicitacao(solicitacao)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={approveSolicitacaoMutation.isPending || rejectSolicitacaoMutation.isPending}
                          onClick={() => handleOpenSolicitacaoEditor(solicitacao)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full bg-[#00A86B] hover:bg-[#00A86B]/90"
                          disabled={approveSolicitacaoMutation.isPending || rejectSolicitacaoMutation.isPending}
                          onClick={() => {
                            approveSolicitacaoMutation.mutate(solicitacao, {
                              onSuccess: () => {
                                toast({
                                  title: "Solicitação aprovada",
                                  description: "A empresa associada foi criada a partir do cadastro público.",
                                });
                              },
                              onError: (err) => {
                                toast({
                                  title: "Falha ao aprovar solicitação",
                                  description: err instanceof Error ? err.message : "Tente novamente em instantes.",
                                  variant: "destructive",
                                });
                              },
                            });
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={approveSolicitacaoMutation.isPending || rejectSolicitacaoMutation.isPending}
                          onClick={() => {
                            rejectSolicitacaoMutation.mutate(solicitacao.id, {
                              onSuccess: () => {
                                toast({
                                  title: "Solicitação recusada",
                                  description: "O pedido saiu da fila de aprovação.",
                                });
                              },
                              onError: (err) => {
                                toast({
                                  title: "Falha ao recusar solicitação",
                                  description: err instanceof Error ? err.message : "Tente novamente em instantes.",
                                  variant: "destructive",
                                });
                              },
                            });
                          }}
                        >
                          Recusar
                        </Button>
                      </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

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

                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                      <SelectItem value="sem-faixa">Sem faixa</SelectItem>
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

            {/* Mobile Card View */}
            {isMobile ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#1C1C1C]">Empresas ({filteredEmpresas.length})</h2>
                {filteredEmpresas.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </Card>
                ) : (
                  paginatedEmpresas.map((empresa) => {
                    const contato = getContatoPrincipal(empresa);
                    return (
                      <Card 
                        key={empresa.id} 
                        className={cn(
                          "p-4 space-y-3",
                          highlightedEmpresaId === empresa.id && "bg-[#DCE7CB]/60"
                        )}
                      >
                        {/* Header with logo and name */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 border shrink-0">
                            <AvatarImage src={empresa.logoUrl} alt={`Logo ${empresa.nomeFantasia}`} />
                            <AvatarFallback className="text-sm font-medium">
                              {empresa.nomeFantasia.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{empresa.nomeFantasia}</h3>
                            <p className="text-xs text-muted-foreground truncate">{empresa.razaoSocial}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{empresa.cnpj}</p>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge className={empresa.associado ? "bg-[#7E8C5E] text-white text-xs" : "bg-secondary text-[#1C1C1C] text-xs"}>
                            {empresa.associado ? "Associada" : "Não associada"}
                          </Badge>
                          <Badge className={empresa.situacaoFinanceira === "Regular" ? "bg-[#DCE7CB] text-[#1C1C1C] text-xs" : "bg-red-500 text-white text-xs"}>
                            {empresa.situacaoFinanceira}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{empresa.porte}</Badge>
                        </div>

                        {/* Key info grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Capital Social</span>
                            <p className="font-medium">{formatCurrency(empresa.capitalSocial)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Faixa</span>
                            <p className="font-medium">{empresa.faixaLabel || "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fundação</span>
                            <p className="font-medium">{formatDate(empresa.dataFundacao)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Associação</span>
                            <p className="font-medium">{formatDate(empresa.dataAssociacao)}</p>
                          </div>
                        </div>

                        {/* Contact info */}
                        {contato && (
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{contato.nome}</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {contato.whatsapp}
                              </p>
                            </div>
                            {contato.whatsapp && contato.whatsapp !== "—" && (
                              <Button 
                                size="sm" 
                                className="h-8 gap-1.5 bg-primary"
                                asChild
                              >
                                <a 
                                  href={`https://wa.me/${contato.whatsapp.replace(/\D/g, "")}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => handleOpenDialog(empresa, true)}
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => handleOpenDialog(empresa, false)}
                          >
                            <Edit className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive"
                            onClick={() => handleDelete(empresa)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
                <TablePagination
                  page={tablePage}
                  pageSize={tablePageSize}
                  total={filteredEmpresas.length}
                  onPageChange={setTablePage}
                  onPageSizeChange={(size) => {
                    setTablePageSize(size);
                    setTablePage(1);
                  }}
                />
              </div>
            ) : (
              /* Desktop Table View */
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
                        {paginatedEmpresas.map((empresa) => {
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
                    <TablePagination
                      page={tablePage}
                      pageSize={tablePageSize}
                      total={filteredEmpresas.length}
                      onPageChange={setTablePage}
                      onPageSizeChange={(size) => {
                        setTablePageSize(size);
                        setTablePage(1);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <DialogTitle>
                    {editingSolicitacao
                      ? "Editar solicitação de associação"
                      : editingEmpresa
                        ? (isViewMode ? "Visualizar Empresa" : "Editar Empresa")
                        : "Cadastrar Empresa"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSolicitacao
                      ? "Revise e altere os dados enviados antes de aprovar ou recusar a solicitação."
                      : "Preencha os campos obrigatórios para manter os dados atualizados."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {validationErrors.length > 0 && !isViewMode && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      Campos obrigatórios pendentes:{" "}
                      {validationErrors
                        .map((field) =>
                          ({
                            razaoSocial: "Razão Social",
                            cnpj: "CNPJ",
                            tipoVinculo: "Tipo de vínculo",
                            categoriaMantenedor: "Categoria do mantenedor",
                            valorMensalidadeVinculo: "Valor mensal negociado",
                            situacaoFinanceira: "Situação Financeira",
                            porte: "Porte",
                            dataFundacao: "Fundação",
                          }[field] || field),
                        )
                        .join(", ")}
                    </div>
                  )}
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
                      <Label>Tipo de vínculo*</Label>
                      <Select
                        value={formData.tipoVinculo || (formData.associado ? "Associado" : undefined)}
                        onValueChange={(value: TipoVinculo) => setFormData((prev) => ({
                          ...prev,
                          tipoVinculo: value,
                          associado: value === "Associado",
                          faixaId: value === "Associado" ? prev.faixaId : undefined,
                          categoriaMantenedor: value === "Mantenedor" ? prev.categoriaMantenedor : undefined,
                          valorMensalidadeVinculo:
                            value === "Mantenedor" || value === "Parceiro" ? prev.valorMensalidadeVinculo : undefined,
                        }))}
                        disabled={isViewMode}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione o vínculo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Associado">Associado</SelectItem>
                          <SelectItem value="Mantenedor">Mantenedor</SelectItem>
                          <SelectItem value="Parceiro">Parceiro</SelectItem>
                          <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Cada empresa possui somente um tipo de vínculo.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social*</Label>
                      <Input
                        id="razaoSocial"
                        placeholder="Digite a razão social"
                        value={formData.razaoSocial || ""}
                        onChange={(e) => {
                          clearValidationError("razaoSocial");
                          setFormData((prev) => ({ ...prev, razaoSocial: e.target.value }));
                        }}
                        className={cn(validationErrors.includes("razaoSocial") && "border-destructive focus-visible:ring-destructive")}
                        disabled={isViewMode}
                      />
                    </div>
                    {formData.tipoVinculo === "Mantenedor" && (
                      <div className="space-y-2">
                        <Label>Categoria do mantenedor*</Label>
                        <Select
                          value={formData.categoriaMantenedor}
                          onValueChange={(value: CategoriaMantenedor) => setFormData((prev) => ({ ...prev, categoriaMantenedor: value }))}
                          disabled={isViewMode}
                        >
                          <SelectTrigger><SelectValue placeholder="Ouro, prata ou bronze" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ouro">Ouro</SelectItem>
                            <SelectItem value="Prata">Prata</SelectItem>
                            <SelectItem value="Bronze">Bronze</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {(formData.tipoVinculo === "Mantenedor" || formData.tipoVinculo === "Parceiro") && (
                      <div className="space-y-2">
                        <Label htmlFor="valorMensalidadeVinculo">Valor mensal negociado*</Label>
                        <Input
                          id="valorMensalidadeVinculo"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.valorMensalidadeVinculo ?? ""}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            valorMensalidadeVinculo: event.target.value ? Number(event.target.value) : undefined,
                          }))}
                          disabled={isViewMode}
                          placeholder="0,00"
                        />
                        <p className="text-xs text-muted-foreground">Usado na emissão mensal em lote; pode variar por empresa.</p>
                      </div>
                    )}
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
                      <div className="flex gap-2">
                        <Input
                          id="cnpj"
                          placeholder="00.000.000/0000-00"
                          value={formData.cnpj || ""}
                          onChange={(e) => handleCnpjChange(e.target.value)}
                          onBlur={() => void handleReceitaWsLookup(formData.cnpj || "", { silent: true })}
                          className={cn(validationErrors.includes("cnpj") && "border-destructive focus-visible:ring-destructive")}
                          disabled={isViewMode || isLookingUpCnpj}
                        />
                        {!isViewMode && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleReceitaWsLookup()}
                            disabled={isLookingUpCnpj || (formData.cnpj || "").replace(/\D/g, "").length !== 14}
                            aria-label="Buscar dados da empresa na ReceitaWS"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            {isLookingUpCnpj ? "Buscando..." : "Buscar"}
                          </Button>
                        )}
                      </div>
                      {hasReceitaWsSuggestions ? (
                        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Dados sugeridos pela ReceitaWS. Revise e altere qualquer campo antes de salvar.</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Ao informar um CNPJ válido, os dados públicos serão usados como sugestões editáveis para o cadastro.
                        </p>
                      )}
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
                  </div>

                  <div className="rounded-xl border border-[#DCE7CB] bg-white p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-[#1C1C1C]">Endereço da empresa</h3>
                      <p className="text-sm text-muted-foreground">
                        Informe o CEP para preencher automaticamente com a ViaCEP. No salvamento, os campos são consolidados no endereço único da empresa.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="empresaCep">CEP</Label>
                        <div className="flex gap-2">
                          <Input
                            id="empresaCep"
                            placeholder="00000-000"
                            value={formData.cep || ""}
                            onChange={(e) => handleCepChange(e.target.value)}
                            onBlur={() => void handleCepLookup(formData.cep || "", { silent: true })}
                            disabled={isViewMode || isLookingUpCep}
                          />
                          {!isViewMode && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleCepLookup()}
                              disabled={isLookingUpCep || (formData.cep || "").replace(/\D/g, "").length !== 8}
                              className="shrink-0"
                            >
                              {isLookingUpCep ? "Buscando..." : "Buscar"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="empresaLogradouro">Rua / Logradouro</Label>
                        <Input
                          id="empresaLogradouro"
                          placeholder="Rua, avenida, travessa..."
                          value={formData.logradouro || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, logradouro: e.target.value }))}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="empresaNumero">Número</Label>
                        <Input
                          id="empresaNumero"
                          placeholder="123"
                          value={formData.numero || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="empresaComplemento">Complemento</Label>
                        <Input
                          id="empresaComplemento"
                          placeholder="Sala, bloco, loja..."
                          value={formData.complemento || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, complemento: e.target.value }))}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="empresaBairro">Bairro</Label>
                        <Input
                          id="empresaBairro"
                          placeholder="Bairro"
                          value={formData.bairro || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, bairro: e.target.value }))}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="empresaUf">Estado</Label>
                        <Select
                          value={formData.uf || undefined}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, uf: value }))}
                          disabled={isViewMode}
                        >
                          <SelectTrigger id="empresaUf">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {ufOptions.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="empresaMunicipio">Cidade</Label>
                        <Input
                          id="empresaMunicipio"
                          placeholder="Cidade"
                          value={formData.municipio || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, municipio: e.target.value }))}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Situação Financeira*</Label>
                      <Select
                        value={formData.situacaoFinanceira || "unset"}
                        onValueChange={(value) => {
                          clearValidationError("situacaoFinanceira");
                          setFormData((prev) => ({
                            ...prev,
                            situacaoFinanceira:
                              value === "unset"
                                ? undefined
                                : (value as Empresa["situacaoFinanceira"]),
                          }));
                        }}
                        disabled={isViewMode}
                      >
                        <SelectTrigger className={cn(validationErrors.includes("situacaoFinanceira") && "border-destructive focus:ring-destructive")}>
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
                        onValueChange={(value) => {
                          clearValidationError("porte");
                          setFormData((prev) => ({
                            ...prev,
                            porte: value === "unset" ? undefined : (value as Empresa["porte"]),
                          }));
                        }}
                        disabled={isViewMode}
                      >
                        <SelectTrigger className={cn(validationErrors.includes("porte") && "border-destructive focus:ring-destructive")}>
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
                      <Label htmlFor="fundacao">Fundação</Label>
                      <Input
                        id="fundacao"
                        type="date"
                        value={formData.dataFundacao || ""}
                        onChange={(e) => {
                          clearValidationError("dataFundacao");
                          setFormData((prev) => ({ ...prev, dataFundacao: e.target.value }));
                        }}
                        className={cn(validationErrors.includes("dataFundacao") && "border-destructive focus-visible:ring-destructive")}
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
                        onChange={(e) => {
                          const dataDesassociacao = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dataDesassociacao,
                            ...(dataDesassociacao ? { associado: false } : {}),
                          }));
                        }}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  {editingSolicitacao && (
                    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <Label htmlFor="qtdFuncionariosSolicitacao">Quantidade de funcionários</Label>
                        <Input
                          id="qtdFuncionariosSolicitacao"
                          type="number"
                          min="0"
                          value={formData.qtdFuncionarios ?? ""}
                          onChange={(event) => setFormData((prev) => ({
                            ...prev,
                            qtdFuncionarios: event.target.value ? Number(event.target.value) : undefined,
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="observacoesSolicitacao">Observações da solicitação</Label>
                        <Textarea
                          id="observacoesSolicitacao"
                          value={formData.observacoesSolicitacao || ""}
                          onChange={(event) => setFormData((prev) => ({ ...prev, observacoesSolicitacao: event.target.value }))}
                          placeholder="Observações enviadas pela empresa ou registradas durante a revisão"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
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
                    <div className="space-y-2">
                      <Label htmlFor="descontoMensalidade">Desconto mensalidade (%)</Label>
                      <Input
                        id="descontoMensalidade"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.descontoMensalidadePercentual ?? 0}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            descontoMensalidadePercentual: Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0,
                          }));
                        }}
                        disabled={isViewMode}
                      />
                      <p className="text-xs text-muted-foreground">Aplicado automaticamente nos boletos de mensalidade por faixa.</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C]">Quadro societário</h3>
                        <p className="text-sm text-muted-foreground">
                          Sócios sugeridos pela ReceitaWS. Revise, complemente ou remova os registros antes de salvar.
                        </p>
                      </div>
                      {!isViewMode && (
                        <Button type="button" variant="outline" size="sm" onClick={addSocio}>+ Sócio</Button>
                      )}
                    </div>
                    {(formData.socios || []).length === 0 ? (
                      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Nenhum sócio informado.</p>
                    ) : (
                      <div className="space-y-3">
                        {(formData.socios || []).map((socio, index) => (
                          <div key={`${socio.id || "novo"}-${index}`} className="space-y-3 rounded-md border bg-muted/10 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">Sócio {index + 1}</p>
                              {!isViewMode && <Button type="button" variant="ghost" size="sm" onClick={() => removeSocio(index)}>Remover</Button>}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input value={socio.nome} onChange={(event) => updateSocio(index, "nome", event.target.value)} disabled={isViewMode} />
                              </div>
                              <div className="space-y-2">
                                <Label>Qualificação</Label>
                                <Input value={socio.qualificacao || ""} onChange={(event) => updateSocio(index, "qualificacao", event.target.value)} disabled={isViewMode} />
                              </div>
                              <div className="space-y-2">
                                <Label>País de origem</Label>
                                <Input value={socio.paisOrigem || ""} onChange={(event) => updateSocio(index, "paisOrigem", event.target.value)} disabled={isViewMode} />
                              </div>
                              <div className="space-y-2">
                                <Label>Representante legal</Label>
                                <Input value={socio.nomeRepresentanteLegal || ""} onChange={(event) => updateSocio(index, "nomeRepresentanteLegal", event.target.value)} disabled={isViewMode} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Qualificação do representante legal</Label>
                              <Input value={socio.qualificacaoRepresentanteLegal || ""} onChange={(event) => updateSocio(index, "qualificacaoRepresentanteLegal", event.target.value)} disabled={isViewMode} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C]">Atividades econômicas (CNAEs)</h3>
                        <p className="text-sm text-muted-foreground">
                          A atividade principal e as secundárias são importadas da ReceitaWS e permanecem editáveis.
                        </p>
                      </div>
                      {!isViewMode && (
                        <Button type="button" variant="outline" size="sm" onClick={addAtividadeEconomica}>+ CNAE</Button>
                      )}
                    </div>
                    {(formData.atividadesEconomicas || []).length === 0 ? (
                      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Nenhuma atividade econômica informada.</p>
                    ) : (
                      <div className="space-y-3">
                        {(formData.atividadesEconomicas || []).map((atividade, index) => (
                          <div key={`${atividade.id || "novo"}-${index}`} className="space-y-3 rounded-md border bg-muted/10 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                  type="radio"
                                  name="atividade-principal"
                                  checked={atividade.principal}
                                  onChange={() => updateAtividadeEconomica(index, "principal", true)}
                                  disabled={isViewMode}
                                />
                                CNAE principal
                              </label>
                              {!isViewMode && <Button type="button" variant="ghost" size="sm" onClick={() => removeAtividadeEconomica(index)}>Remover</Button>}
                            </div>
                            <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                              <div className="space-y-2">
                                <Label>Código</Label>
                                <Input value={atividade.codigo} onChange={(event) => updateAtividadeEconomica(index, "codigo", event.target.value)} disabled={isViewMode} />
                              </div>
                              <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input value={atividade.descricao} onChange={(event) => updateAtividadeEconomica(index, "descricao", event.target.value)} disabled={isViewMode} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C]">Vínculos institucionais/comerciais</h3>
                        <p className="text-sm text-muted-foreground">
                          Use para indicar quando a empresa também é parceira, mantenedora ou fornecedora. Isso não altera o campo Associado.
                        </p>
                      </div>
                      {!isViewMode && (
                        <Button type="button" variant="outline" size="sm" onClick={addRelacionamento}>
                          + Vínculo
                        </Button>
                      )}
                    </div>
                    {(formData.relacionamentos || []).length === 0 ? (
                      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        Nenhum vínculo cadastrado para esta empresa.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(formData.relacionamentos || []).map((relacionamento, index) => (
                          <div key={index} className="rounded-md border p-3 space-y-3 bg-muted/10">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">Vínculo {index + 1}</p>
                              {!isViewMode && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeRelacionamento(index)}>
                                  Remover
                                </Button>
                              )}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select
                                  value={relacionamento.tipo}
                                  onValueChange={(value) => updateRelacionamento(index, "tipo", value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {relacionamentoTipoOptions.map((tipo) => (
                                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  value={relacionamento.status || relacionamentoStatusOptions[relacionamento.tipo][0]}
                                  onValueChange={(value) => updateRelacionamento(index, "status", value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {relacionamentoStatusOptions[relacionamento.tipo].map((status) => (
                                      <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {(relacionamento.tipo === "Parceiro" || relacionamento.tipo === "Fornecedor") && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Categoria</Label>
                                  <Select
                                    value={relacionamento.categoria || "none"}
                                    onValueChange={(value) => updateRelacionamento(index, "categoria", value === "none" ? "" : value)}
                                    disabled={isViewMode}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem categoria</SelectItem>
                                      {(relacionamento.tipo === "Parceiro" ? categoriasParceiro : categoriasFornecedor).map((categoria) => (
                                        <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              {relacionamento.tipo === "Parceiro" && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Descrição</Label>
                                  <Input
                                    placeholder="Descreva a parceria"
                                    value={relacionamento.descricao || ""}
                                    onChange={(e) => updateRelacionamento(index, "descricao", e.target.value)}
                                    disabled={isViewMode}
                                  />
                                </div>
                              )}
                              {relacionamento.tipo === "Mantenedor" && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Contrapartidas</Label>
                                  <Input
                                    placeholder="Ex: Logo em eventos, menção em materiais"
                                    value={relacionamento.contrapartidas || ""}
                                    onChange={(e) => updateRelacionamento(index, "contrapartidas", e.target.value)}
                                    disabled={isViewMode}
                                  />
                                </div>
                              )}
                              {relacionamento.tipo === "Fornecedor" && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Observações</Label>
                                  <Input
                                    placeholder="Observações adicionais"
                                    value={relacionamento.observacoes || ""}
                                    onChange={(e) => updateRelacionamento(index, "observacoes", e.target.value)}
                                    disabled={isViewMode}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C]">Responsáveis (opcional)</h3>
                        <p className="text-sm text-muted-foreground">
                          Marque contato principal para priorizar um responsável. Sem marcação, o contato principal segue o primeiro colaborador da lista.
                        </p>
                      </div>
                      {!isViewMode && (
                        <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                          + Responsável
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(formData.responsaveis?.length ? formData.responsaveis : [{ nome: "", cpf: "", dataAniversario: "", whatsapp: "", email: "", contatoPrincipal: false }]).map((responsavel, index) => (
                        <div key={index} className="rounded-md border p-3 space-y-3 bg-muted/10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Responsável {index + 1}</p>
                            {!isViewMode && (formData.responsaveis?.length || 0) > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeResponsavel(index)}>
                                Remover
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nome</Label>
                              <Input
                                placeholder="Nome do responsável"
                                value={responsavel.nome || ""}
                                onChange={(e) => updateResponsavel(index, "nome", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CPF</Label>
                              <Input
                                placeholder="000.000.000-00"
                                value={responsavel.cpf || ""}
                                onChange={(e) => updateResponsavel(index, "cpf", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Data de nascimento</Label>
                              <Input
                                type="date"
                                value={responsavel.dataAniversario || ""}
                                onChange={(e) => updateResponsavel(index, "dataAniversario", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>E-mail</Label>
                              <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={responsavel.email || ""}
                                onChange={(e) => updateResponsavel(index, "email", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>WhatsApp</Label>
                              <Input
                                placeholder="(00) 00000-0000"
                                value={responsavel.whatsapp || ""}
                                onChange={(e) => updateResponsavel(index, "whatsapp", e.target.value)}
                                disabled={isViewMode}
                              />
                            </div>
                            <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:self-end">
                              <input
                                type="checkbox"
                                checked={Boolean(responsavel.contatoPrincipal)}
                                onChange={(e) => updateResponsavel(index, "contatoPrincipal", e.target.checked)}
                                disabled={isViewMode}
                              />
                              Contato principal
                            </label>
                          </div>
                        </div>
                      ))}
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
                    <Button variant="outline" onClick={handleCloseDialog} disabled={saveEmpresaMutation.isPending || saveSolicitacaoMutation.isPending}>
                      Cancelar
                    </Button>
                    {!isViewMode && (
                      <Button onClick={handleSave} className="bg-[#1C1C1C] hover:bg-[#1C1C1C]/90" disabled={saveEmpresaMutation.isPending || saveSolicitacaoMutation.isPending}>
                        {saveEmpresaMutation.isPending || saveSolicitacaoMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={associationHistoryOpen} onOpenChange={setAssociationHistoryOpen}>
              <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ordem de associação das empresas</DialogTitle>
                  <DialogDescription>
                    Lista das empresas atualmente associadas, da associação mais recente para a mais antiga.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-[#F7F8F4] p-3">
                    <p className="text-xs text-muted-foreground">Total de associadas</p>
                    <p className="text-2xl font-bold text-[#1C1C1C]">{empresasPorDataAssociacao.length}</p>
                  </div>
                  <div className="rounded-lg border bg-[#F7F8F4] p-3">
                    <p className="text-xs text-muted-foreground">Sem data de associação</p>
                    <p className="text-2xl font-bold text-[#1C1C1C]">
                      {empresasPorDataAssociacao.filter((empresa) => !empresa.dataAssociacao).length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ordem</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Data de associação</TableHead>
                        <TableHead>Tempo associada</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresasPorDataAssociacao.map((empresa, index) => (
                        <TableRow key={empresa.id}>
                          <TableCell>
                            <Badge variant="outline" className="bg-[#F7F8F4]">#{index + 1}</Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-[#1C1C1C]">{empresa.nomeFantasia || empresa.razaoSocial}</p>
                            {empresa.nomeFantasia && empresa.nomeFantasia !== empresa.razaoSocial && (
                              <p className="text-xs text-muted-foreground">{empresa.razaoSocial}</p>
                            )}
                          </TableCell>
                          <TableCell>{formatAssociationDate(empresa.dataAssociacao)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Clock3 className="h-4 w-4 text-[#7E8C5E]" />
                              {getAssociationDuration(empresa.dataAssociacao)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssociationHistoryOpen(false);
                                handleOpenDialog(empresa, true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver cadastro
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!selectedSolicitacao}
              onOpenChange={(open) => {
                if (!open) setSelectedSolicitacao(null);
              }}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhes da solicitação</DialogTitle>
                  <DialogDescription>
                    Confira todos os dados enviados pela empresa antes de aprovar ou recusar o cadastro.
                  </DialogDescription>
                </DialogHeader>

                {selectedSolicitacao && (
                  <div className="space-y-5">
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => handleOpenSolicitacaoEditor(selectedSolicitacao)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar todos os dados
                      </Button>
                    </div>
                    <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[#1C1C1C]">
                            {selectedSolicitacao.nome_fantasia || selectedSolicitacao.razao_social}
                          </h3>
                          <p className="text-sm text-muted-foreground">{selectedSolicitacao.razao_social}</p>
                        </div>
                        <Badge variant="outline" className="w-fit capitalize">
                          {selectedSolicitacao.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Dados da empresa</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                          {[
                            ["CNPJ", selectedSolicitacao.cnpj],
                            ["Razão Social", selectedSolicitacao.razao_social],
                            ["Nome Fantasia", selectedSolicitacao.nome_fantasia],
                            ["E-mail", selectedSolicitacao.email],
                            ["WhatsApp", selectedSolicitacao.whatsapp],
                            ["Endereço", selectedSolicitacao.endereco],
                            ["Porte", selectedSolicitacao.porte],
                            ["Capital Social", selectedSolicitacao.capital_social !== undefined && selectedSolicitacao.capital_social !== null ? formatCurrency(Number(selectedSolicitacao.capital_social)) : undefined],
                            ["Data de fundação", formatDate(selectedSolicitacao.data_fundacao)],
                            ["Qtd. funcionários", selectedSolicitacao.qtd_funcionarios?.toString()],
                            ["Enviada em", formatDate(selectedSolicitacao.created_at)],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                              <p className="mt-1 break-words text-[#1C1C1C]">{value || "—"}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Responsável principal</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                          {[
                            ["Nome", selectedSolicitacao.responsavel_nome],
                            ["CPF", selectedSolicitacao.responsavel_cpf],
                            ["E-mail", selectedSolicitacao.responsavel_email],
                            ["WhatsApp", selectedSolicitacao.responsavel_whatsapp],
                            ["Data de nascimento", formatDate(selectedSolicitacao.responsavel_data_nascimento)],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                              <p className="mt-1 break-words text-[#1C1C1C]">{value || "—"}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Dados adicionais enviados</CardTitle>
                        <DialogDescription>
                          Informações flexíveis armazenadas no payload da solicitação.
                        </DialogDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Responsáveis no payload</h4>
                          {(selectedSolicitacao.payload?.responsaveis?.length ?? 0) > 0 ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              {selectedSolicitacao.payload?.responsaveis?.map((responsavel, index) => (
                                <div key={`${responsavel.nome}-${index}`} className="rounded-lg border p-3 text-sm">
                                  <p className="font-medium">{responsavel.nome || `Responsável ${index + 1}`}</p>
                                  <p className="text-muted-foreground">CPF: {responsavel.cpf || "—"}</p>
                                  <p className="text-muted-foreground">E-mail: {responsavel.email || "—"}</p>
                                  <p className="text-muted-foreground">WhatsApp: {responsavel.whatsapp || "—"}</p>
                                  <p className="text-muted-foreground">Nascimento: {formatDate(responsavel.dataAniversario)}</p>
                                  {responsavel.contatoPrincipal && <Badge className="mt-2 bg-[#7E8C5E] text-white">Contato principal</Badge>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum responsável adicional enviado.</p>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Colaboradores</h4>
                            {(selectedSolicitacao.payload?.colaboradores?.length ?? 0) > 0 ? (
                              <div className="space-y-2">
                                {selectedSolicitacao.payload?.colaboradores?.map((colaborador, index) => (
                                  <div key={`${colaborador.nome}-${index}`} className="rounded-lg border p-3 text-sm">
                                    <p className="font-medium">{colaborador.nome || `Colaborador ${index + 1}`}</p>
                                    <p className="text-muted-foreground">Cargo: {colaborador.cargo || "—"}</p>
                                    <p className="text-muted-foreground">E-mail: {colaborador.email || "—"}</p>
                                    <p className="text-muted-foreground">WhatsApp: {colaborador.whatsapp || "—"}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum colaborador enviado.</p>
                            )}
                          </div>
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Vínculos</h4>
                            {(selectedSolicitacao.payload?.relacionamentos?.length ?? 0) > 0 ? (
                              <div className="space-y-2">
                                {selectedSolicitacao.payload?.relacionamentos?.map((relacionamento, index) => (
                                  <div key={`${relacionamento.tipo}-${index}`} className="rounded-lg border p-3 text-sm">
                                    <p className="font-medium">{relacionamento.tipo || `Vínculo ${index + 1}`}</p>
                                    <p className="text-muted-foreground">Status: {relacionamento.status || "—"}</p>
                                    <p className="text-muted-foreground">Categoria: {relacionamento.categoria || "—"}</p>
                                    <p className="text-muted-foreground">Descrição: {relacionamento.descricao || "—"}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum vínculo enviado.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Quadro societário</h4>
                            {(selectedSolicitacao.payload?.socios?.length ?? 0) > 0 ? (
                              <div className="space-y-2">
                                {selectedSolicitacao.payload?.socios?.map((socio, index) => (
                                  <div key={`${socio.nome}-${index}`} className="rounded-lg border p-3 text-sm">
                                    <p className="font-medium">{socio.nome}</p>
                                    <p className="text-muted-foreground">Qualificação: {socio.qualificacao || "—"}</p>
                                    <p className="text-muted-foreground">País de origem: {socio.paisOrigem || "—"}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum sócio retornado pela ReceitaWS.</p>
                            )}
                          </div>
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Atividades econômicas</h4>
                            {(selectedSolicitacao.payload?.atividadesEconomicas?.length ?? 0) > 0 ? (
                              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                {selectedSolicitacao.payload?.atividadesEconomicas?.map((atividade, index) => (
                                  <div key={`${atividade.codigo}-${index}`} className="rounded-lg border p-3 text-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium">{atividade.codigo}</p>
                                      {atividade.principal && <Badge variant="outline">Principal</Badge>}
                                    </div>
                                    <p className="text-muted-foreground">{atividade.descricao}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum CNAE retornado pela ReceitaWS.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-[#1C1C1C]">Observações</h4>
                          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                            {selectedSolicitacao.observacoes || "Nenhuma observação enviada."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
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
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteEmpresaMutation.isPending}>
                    {deleteEmpresaMutation.isPending ? "Excluindo..." : "Excluir"}
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
