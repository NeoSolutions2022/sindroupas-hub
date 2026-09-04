import { useEffect, useMemo, useState } from "react";
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
import { FileDown, Eye, Calculator, Plus, Edit, Trash2, Building2, CalendarIcon, MessageCircle, Mail, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BoletoRegistro, HistoricoContribuicao } from "@/lib/financeiro-data";
import { AdvancedFilters, FilterState, defaultFilters } from "@/components/financeiro/AdvancedFilters";
import { GerarNovoBoletoModal } from "@/components/financeiro/GerarNovoBoletoModal";
import { BoletoActionsCell } from "@/components/financeiro/BoletoActionsCell";
import { format, parse, parseISO, isValid, isBefore, isAfter, differenceInDays, startOfMonth, addMonths, startOfDay, endOfDay } from "date-fns";
import { hasuraRequest } from "@/lib/api/hasura";
import { cancelBoletoRequest, createBoletoRequest, CreateBoletoPayload, resendBoletoEmailRequest, updateBoletoDueDateRequest } from "@/lib/api/boletos";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { Progress } from "@/components/ui/progress";
import { normalizeBrazilianWhatsappNumber, sendEvolutionTextRequest } from "@/lib/api/evolution";

type EmpresaLookupRow = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  data_associacao?: string | null;
  faixa_id?: string | null;
  associada?: boolean | null;
  tipo_vinculo?: "Associado" | "Mantenedor" | "Parceiro" | "Fornecedor" | null;
  categoria_mantenedor?: "Ouro" | "Prata" | "Bronze" | null;
  valor_mensalidade_vinculo?: number | string | null;
  desconto_mensalidade_percentual?: number | string | null;
  observacoes?: string | null;
  qtd_funcionarios?: number | null;
  cnpj?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  responsaveis?: { id: string; nome?: string | null; whatsapp?: string | null; email?: string | null; contato_principal?: boolean | null }[];
  colaboradores?: { id: string; nome?: string | null; whatsapp?: string | null; email?: string | null }[];
};

type BoletoRow = {
  id: string;
  efi_charge_id?: string | null;
  pdf_url?: string | null;
  tipo?: string | null;
  valor?: number | string | null;
  vencimento?: string | null;
  efi_status?: string | null;
  descricao?: string | null;
  competencia_inicial?: string | null;
  competencia_final?: string | null;
  faixa_id?: string | null;
  ano?: string | null;
  periodicidade?: string | null;
  parcelas?: number | null;
  base?: number | string | null;
  percentual?: number | string | null;
  descontos?: number | string | null;
  enviado_email_em?: string | null;
  enviado_whatsapp_em?: string | null;
  enviado_email_para?: string | null;
  enviado_whatsapp_para?: string | null;
  ultimo_envio_boleto_em?: string | null;
  ultimo_envio_boleto_canal?: string | null;
  empresa?: { id: string; razao_social: string; nome_fantasia?: string | null } | null;
};

type ContribuicaoRow = {
  id: string;
  ano?: string | null;
  periodicidade?: string | null;
  parcelas?: number | null;
  base?: number | string | null;
  percentual?: number | string | null;
  descontos?: number | string | null;
  valor?: number | string | null;
  vencimento?: string | null;
  situacao?: string | null;
  folha_repetida_ano_anterior?: boolean | null;
  empresa?: { id: string; razao_social: string; nome_fantasia?: string | null } | null;
};

type FaixaRow = {
  id: string;
  label?: string | null;
  min_colaboradores?: number | null;
  max_colaboradores?: number | null;
  valor_mensalidade?: number | string | null;
};

const FINANCEIRO_QUERY = `
  query FinanceiroPage {
    financeiro_boletos(order_by: { vencimento: desc }) {
      id
      efi_charge_id
      pdf_url
      tipo
      valor
      vencimento
      efi_status
      descricao
      competencia_inicial
      competencia_final
      faixa_id
      ano
      periodicidade
      parcelas
      base
      percentual
      descontos
      enviado_email_em
      enviado_whatsapp_em
      enviado_email_para
      enviado_whatsapp_para
      ultimo_envio_boleto_em
      ultimo_envio_boleto_canal
      empresa {
        id
        razao_social
        nome_fantasia
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
      folha_repetida_ano_anterior
      empresa {
        id
        razao_social
      }
    }
    empresas(order_by: { razao_social: asc }) {
      id
      razao_social
      nome_fantasia
      data_associacao
      faixa_id
      associada
      tipo_vinculo
      categoria_mantenedor
      valor_mensalidade_vinculo
      desconto_mensalidade_percentual
      observacoes
      qtd_funcionarios
      cnpj
      email
      whatsapp
      responsaveis {
        id
        nome
        whatsapp
        email
        contato_principal
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

const EMPRESAS_POR_FAIXA_QUERY = `
  query EmpresasPorFaixa($faixaId: uuid!) {
    empresas(where: { faixa_id: { _eq: $faixaId } }, order_by: { razao_social: asc }) {
      id
      razao_social
      nome_fantasia
      faixa_id
      tipo_vinculo
      categoria_mantenedor
      valor_mensalidade_vinculo
      desconto_mensalidade_percentual
      observacoes
      cnpj
      qtd_funcionarios
      email
      whatsapp
      responsaveis {
        id
        nome
        whatsapp
        email
        contato_principal
      }
      colaboradores {
        id
        nome
        whatsapp
        email
      }
    }
  }
`;

const UPDATE_BOLETO_VENCIMENTO_HASURA = `
  mutation UpdateBoletoVencimento($id: uuid!, $vencimento: date!) {
    update_financeiro_boletos_by_pk(pk_columns: { id: $id }, _set: { vencimento: $vencimento }) {
      id
      vencimento
    }
  }
`;

const UPDATE_BOLETO_STATUS_HASURA = `
  mutation UpdateBoletoStatus($id: uuid!, $efi_status: String!) {
    update_financeiro_boletos_by_pk(pk_columns: { id: $id }, _set: { efi_status: $efi_status }) {
      id
      efi_status
    }
  }
`;

const UPDATE_BOLETO_DESCRICAO_HASURA = `
  mutation UpdateBoletoDescricao($id: uuid!, $descricao: String) {
    update_financeiro_boletos_by_pk(pk_columns: { id: $id }, _set: { descricao: $descricao }) {
      id
      descricao
    }
  }
`;

const UPDATE_BOLETO_ENVIO_EMAIL_HASURA = `
  mutation UpdateBoletoEnvioEmail($id: uuid!, $enviadoEm: timestamptz!, $destinatario: String!) {
    update_financeiro_boletos_by_pk(
      pk_columns: { id: $id }
      _set: {
        enviado_email_em: $enviadoEm
        enviado_email_para: $destinatario
        ultimo_envio_boleto_em: $enviadoEm
        ultimo_envio_boleto_canal: "email"
      }
    ) {
      id
      enviado_email_em
      enviado_email_para
      ultimo_envio_boleto_em
      ultimo_envio_boleto_canal
    }
  }
`;

const UPDATE_BOLETO_ENVIO_WHATSAPP_HASURA = `
  mutation UpdateBoletoEnvioWhatsapp($id: uuid!, $enviadoEm: timestamptz!, $destinatario: String!) {
    update_financeiro_boletos_by_pk(
      pk_columns: { id: $id }
      _set: {
        enviado_whatsapp_em: $enviadoEm
        enviado_whatsapp_para: $destinatario
        ultimo_envio_boleto_em: $enviadoEm
        ultimo_envio_boleto_canal: "whatsapp"
      }
    ) {
      id
      enviado_whatsapp_em
      enviado_whatsapp_para
      ultimo_envio_boleto_em
      ultimo_envio_boleto_canal
    }
  }
`;

// Tipos
interface Faixa {
  id: string;
  min: number;
  max: number;
  valor: number;
  descricao?: string;
}

const SINDICATO_EMAIL = "sindroupas@sindicato.sfiec.org.br";

interface BoletoForm {
  tipo: "mensalidade" | "contribuicao" | "avulso" | "";
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
  baseCalculoAgosto: string;
  quantidadeParcelasContribuicao: 1 | 2;
  vencimentoParcela1: string;
  vencimentoParcela2: string;
  contribuicaoParcelaNumero?: 1 | 2;
  folhaRepetidaAnoAnterior?: boolean;
  valorAvulso: string;
  motivoCobranca: string;
  valorOverride?: number;
  descontoValorOverride?: number;
  emailOverride?: string;
}

type ContribuicaoLoteRow = {
  empresaId: string;
  empresaNome: string;
  folhaAnoAnterior: number;
  folhaAtual: string;
  repetiuFolhaAnterior: boolean;
  quantidadeParcelas: 1 | 2;
};

type TrimestreNumero = 1 | 2 | 3 | 4;

type TrimestreAutomaticoRow = {
  empresaId: string;
  empresaNome: string;
  dataAssociacao: string;
  faixaId: string;
  competenciasEmitidas: string[];
  competenciasPendentes: string[];
  valorMensal: number;
  descontoMensal: number;
  valorTotal: number;
  impedimentos: string[];
};

type ContactCandidate = {
  nome?: string | null;
  email?: string | null;
  whatsapp?: string | null;
};

const normalizeBoletoStatus = (status?: string | null): "Pago" | "Aguardando" | "Cancelado" | "Inadimplente" => {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) return "Aguardando";
  if (["pago", "paid", "liquidado", "recebido"].includes(normalized)) return "Pago";
  if (["cancelado", "canceled", "cancelled"].includes(normalized)) return "Cancelado";
  if (["inadimplente", "atrasado", "vencido", "overdue"].includes(normalized)) return "Inadimplente";
  if (["pendente", "emitida", "aguardando", "pending", "waiting"].includes(normalized)) return "Aguardando";
  return "Aguardando";
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getDescricaoContribuicao = (ano: string, numero: number, total: 1 | 2) =>
  `Referente a contribuição assistencial de ${ano} (${total === 1 ? "boleto único" : `${numero}ª parcela de 2`})`;

const periodicidadeToNumero = (periodicidade?: string) => {
  const normalized = periodicidade?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "mensal") return 1;
  if (normalized === "trimestral") return 3;
  if (normalized === "semestral") return 6;
  if (normalized === "anual") return 12;
  const numeric = Number(periodicidade);
  return Number.isFinite(numeric) ? numeric : undefined;
};


const formatDateBR = (value?: string) => {
  if (!value) return "";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : value;
};

const formatDueDateBR = (value?: string) => {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd-MM-yyyy") : value.replace(/\//g, "-");
};

const formatCompetenciaBR = (value?: string) => {
  if (!value) return "";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MM/yyyy") : value;
};

const getCompetenciaRangeLabel = (inicio?: string, fim?: string) => {
  const start = formatCompetenciaBR(inicio);
  const end = formatCompetenciaBR(fim);
  if (!start && !end) return "";
  return start === end || !end ? start : `${start} a ${end}`;
};

const rangesOverlap = (startA?: string, endA?: string, startB?: string, endB?: string) => {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = startOfMonth(parseISO(startA));
  const aEnd = startOfMonth(parseISO(endA));
  const bStart = startOfMonth(parseISO(startB));
  const bEnd = startOfMonth(parseISO(endB));
  if (![aStart, aEnd, bStart, bEnd].every(isValid)) return false;
  return !isAfter(aStart, bEnd) && !isAfter(bStart, aEnd);
};

const getCurrentQuarterRange = () => {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const start = startOfMonth(new Date(now.getFullYear(), quarterStartMonth, 1));
  const end = startOfMonth(addMonths(start, 2));
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
};

const getTrimestre = (ano: number, trimestre: TrimestreNumero) => {
  const inicio = startOfMonth(new Date(ano, (trimestre - 1) * 3, 1));
  const meses = [inicio, addMonths(inicio, 1), addMonths(inicio, 2)];
  return {
    inicio,
    fim: meses[2],
    meses,
    inicioIso: format(inicio, "yyyy-MM-dd"),
    fimIso: format(meses[2], "yyyy-MM-dd"),
  };
};

const MonthPickerField = ({
  value,
  onChange,
  placeholder = "Selecione a competência",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <Input
    type="month"
    aria-label={placeholder}
    value={value ? format(parseISO(value), "yyyy-MM") : ""}
    onChange={(event) => onChange(event.target.value ? `${event.target.value}-01` : "")}
  />
);

const DatePickerField = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const parsedDate = value ? parseISO(value) : undefined;
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;
  const displayValue = selectedDate ? format(selectedDate, "dd/MM/yyyy") : "";
  const [typedValue, setTypedValue] = useState(displayValue);

  useEffect(() => {
    setTypedValue(displayValue);
  }, [displayValue]);

  const maskDateInput = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const commitTypedDate = (masked: string) => {
    if (!masked) {
      onChange("");
      return;
    }

    if (masked.length !== 10) return;

    const typedDate = parse(masked, "dd/MM/yyyy", new Date());
    if (isValid(typedDate) && format(typedDate, "dd/MM/yyyy") === masked) {
      onChange(format(typedDate, "yyyy-MM-dd"));
    }
  };

  const handleInputChange = (input: string) => {
    const masked = maskDateInput(input);
    setTypedValue(masked);
    commitTypedDate(masked);
  };

  const handleInputBlur = () => {
    if (!typedValue) {
      onChange("");
      return;
    }

    const typedDate = parse(typedValue, "dd/MM/yyyy", new Date());
    if (typedValue.length !== 10 || !isValid(typedDate) || format(typedDate, "dd/MM/yyyy") !== typedValue) {
      setTypedValue(displayValue);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={typedValue}
        onChange={(event) => handleInputChange(event.target.value)}
        onBlur={handleInputBlur}
        inputMode="numeric"
        placeholder={placeholder}
        className={cn(!typedValue && "text-muted-foreground")}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Selecionar data no calendário" className="shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const chooseBoletoContact = (
  empresa: Pick<EmpresaLookupRow, "razao_social" | "email" | "whatsapp" | "responsaveis" | "colaboradores">,
) => {
  const responsaveis = empresa.responsaveis ?? [];
  const responsavelPrincipal = responsaveis.find((responsavel) => responsavel.contato_principal);
  const candidates: ContactCandidate[] = [
    ...(responsavelPrincipal ? [responsavelPrincipal] : []),
    ...(empresa.colaboradores ?? []),
    ...(!responsavelPrincipal ? responsaveis : responsaveis.filter((responsavel) => responsavel.id !== responsavelPrincipal.id)),
    {
      nome: empresa.razao_social,
      email: empresa.email,
      whatsapp: empresa.whatsapp,
    },
  ];

  const cleaned = candidates.map((candidate) => ({
    nome: candidate.nome?.trim() || undefined,
    email: candidate.email?.trim() || undefined,
    whatsapp: candidate.whatsapp?.trim() || undefined,
  }));

  const withBoth = cleaned.find((candidate) => candidate.email && candidate.whatsapp);
  if (withBoth) return withBoth;

  const firstEmail = cleaned.find((candidate) => candidate.email)?.email;
  const firstWhatsapp = cleaned.find((candidate) => candidate.whatsapp)?.whatsapp;
  const firstNome = cleaned.find((candidate) => candidate.nome)?.nome ?? empresa.razao_social;

  return {
    nome: firstNome,
    email: firstEmail,
    whatsapp: firstWhatsapp,
  };
};

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
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
  const [selectedBoletoForDueDate, setSelectedBoletoForDueDate] = useState<BoletoView | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [selectedBoletoForDescription, setSelectedBoletoForDescription] = useState<BoletoView | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancellingBoleto, setIsCancellingBoleto] = useState(false);
  const [selectedBoletoForCancel, setSelectedBoletoForCancel] = useState<BoletoView | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelAndRegenerate, setCancelAndRegenerate] = useState(false);
  const [replicateDialogOpen, setReplicateDialogOpen] = useState(false);
  const [selectedBoletoForReplication, setSelectedBoletoForReplication] = useState<BoletoView | null>(null);
  const [replicateCancelAfter, setReplicateCancelAfter] = useState(false);
  const [replicateCancelReason, setReplicateCancelReason] = useState("Boleto replicado e cancelado após nova emissão.");
  const [regeneratedFromCancel, setRegeneratedFromCancel] = useState<string[]>([]);
  const [isEmittingBoletos, setIsEmittingBoletos] = useState(false);
  const [batchEmissionProgress, setBatchEmissionProgress] = useState({ done: 0, total: 0 });
  const [sendingBoletoCommunication, setSendingBoletoCommunication] = useState<string | null>(null);
  const [trimestreAutomaticoOpen, setTrimestreAutomaticoOpen] = useState(false);
  const [trimestreAutomaticoConfirmOpen, setTrimestreAutomaticoConfirmOpen] = useState(false);
  const [trimestreAutomaticoNumero, setTrimestreAutomaticoNumero] = useState<TrimestreNumero>(
    () => (Math.floor(new Date().getMonth() / 3) + 1) as TrimestreNumero,
  );
  const [trimestreAutomaticoAno, setTrimestreAutomaticoAno] = useState(() => String(new Date().getFullYear()));
  const [trimestreAutomaticoVencimento, setTrimestreAutomaticoVencimento] = useState("");

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

  const boletos = useMemo<BoletoView[]>(() => {
    return (
      data?.financeiro_boletos.map((boleto) => {
        const tipoNormalizado: BoletoRegistro["tipo"] = boleto.tipo === "avulso" || boleto.tipo === "Boleto avulso"
          ? "Boleto avulso"
          : boleto.tipo === "contribuicao" || boleto.tipo === "Contribuição Assistencial"
            ? "Contribuição Assistencial"
            : "Mensalidade (por Faixa)";

        return {
          id: boleto.id,
          efiChargeId: boleto.efi_charge_id ?? null,
          pdfUrl: boleto.pdf_url ?? null,
          tipo: tipoNormalizado,
          empresaId: boleto.empresa?.id,
          empresa: boleto.empresa?.razao_social ?? "Empresa não informada",
          empresaFantasia: boleto.empresa?.nome_fantasia?.trim() || undefined,
          valor: boleto.valor !== undefined && boleto.valor !== null ? Number(boleto.valor) : 0,
          vencimento: boleto.vencimento ?? "",
          status: normalizeBoletoStatus(boleto.efi_status),
          descricao: boleto.descricao ?? "",
          competenciaInicial: boleto.competencia_inicial ?? undefined,
          competenciaFinal: boleto.competencia_final ?? undefined,
          faixaId: boleto.faixa_id ?? undefined,
          ano: boleto.ano ?? undefined,
          periodicidade: boleto.periodicidade ?? undefined,
          parcelas: boleto.parcelas ?? undefined,
          base: boleto.base !== undefined && boleto.base !== null ? Number(boleto.base) : undefined,
          percentual: boleto.percentual !== undefined && boleto.percentual !== null ? Number(boleto.percentual) : undefined,
          descontos: boleto.descontos !== undefined && boleto.descontos !== null ? Number(boleto.descontos) : undefined,
          enviadoEmailEm: boleto.enviado_email_em ?? null,
          enviadoWhatsappEm: boleto.enviado_whatsapp_em ?? null,
          enviadoEmailPara: boleto.enviado_email_para ?? null,
          enviadoWhatsappPara: boleto.enviado_whatsapp_para ?? null,
          ultimoEnvioBoletoEm: boleto.ultimo_envio_boleto_em ?? null,
          ultimoEnvioBoletoCanal: boleto.ultimo_envio_boleto_canal ?? null,
        };
      }) ?? []
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
        base: item.base !== undefined && item.base !== null ? Number(item.base) : 0,
        percentual: item.percentual !== undefined && item.percentual !== null ? Number(item.percentual) : 0,
        descontos: item.descontos !== undefined && item.descontos !== null ? Number(item.descontos) : 0,
        valor: item.valor !== undefined && item.valor !== null ? Number(item.valor) : 0,
        vencimento: item.vencimento ?? "",
        situacao: item.situacao ?? "Emitida",
      })) ?? []
    );
  }, [data?.contribuicoes_assistenciais]);

  const mockEmpresas = useMemo(
    () =>
      data?.empresas.map((empresa) => {
        const contato = chooseBoletoContact(empresa);
        return {
          id: empresa.id,
          nome: empresa.nome_fantasia?.trim() || empresa.razao_social,
          razaoSocial: empresa.razao_social,
          nomeFantasia: empresa.nome_fantasia ?? "",
          associada: Boolean(empresa.associada),
          dataAssociacao: empresa.data_associacao ?? "",
          faixaId: empresa.faixa_id ?? "",
          tipoVinculo: empresa.tipo_vinculo ?? (empresa.associada ? "Associado" : "Fornecedor"),
          categoriaMantenedor: empresa.categoria_mantenedor ?? "",
          valorMensalidadeVinculo: Number(empresa.valor_mensalidade_vinculo ?? 0),
          descontoMensalidadePercentual: Number(empresa.desconto_mensalidade_percentual ?? 0),
          cnpj: empresa.cnpj ?? "",
          qtdFuncionarios: empresa.qtd_funcionarios ?? empresa.colaboradores?.length ?? 0,
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
      const empresa = mockEmpresas.find((item) => item.id === payload.empresaId);
      if (!empresa) {
        throw new Error("Empresa não encontrada para emissão do boleto.");
      }

      const contato = empresa.contatoPrincipal;
      const emailBoleto = payload.emailOverride || contato.email;
      const phoneNumber = (contato.whatsapp || "").replace(/\D/g, "");
      if (!emailBoleto || !phoneNumber) {
        throw new Error("A empresa selecionada precisa ter e-mail e WhatsApp para emissão do boleto.");
      }
      if (!empresa.cnpj) {
        throw new Error("Empresa sem CNPJ. O endpoint de boletos exige cliente PJ com CNPJ ou PF com CPF.");
      }

      const valorBoleto = payload.tipo === "contribuicao"
        ? payload.valorOverride ?? payload.valorCalculado
        : payload.tipo === "avulso"
          ? parseCurrencyInput(payload.valorAvulso)
          : payload.valorOverride ?? previaBoleto ?? (
              empresa.tipoVinculo === "Mantenedor" || empresa.tipoVinculo === "Parceiro"
                ? empresa.valorMensalidadeVinculo
                : getValorFaixa(payload.faixaId)
            );
      if (valorBoleto <= 0) {
        throw new Error("Valor do boleto inválido. Informe um valor maior que zero.");
      }

      const descricaoBoleto = payload.tipo === "contribuicao"
        ? getDescricaoContribuicao(payload.anoContribuicao, payload.contribuicaoParcelaNumero ?? 1, payload.quantidadeParcelasContribuicao)
        : payload.tipo === "avulso"
          ? payload.motivoCobranca.trim()
          : empresa.tipoVinculo === "Associado"
            ? "Mensalidade de associado por faixa"
            : `Mensalidade de ${empresa.tipoVinculo.toLowerCase()}`;
      const itemName = payload.tipo === "contribuicao"
        ? `Contribuição Assistencial ${payload.anoContribuicao} - ${payload.quantidadeParcelasContribuicao === 1 ? "boleto único" : `${payload.contribuicaoParcelaNumero}ª parcela de 2`}`
        : payload.tipo === "avulso"
          ? "Boleto avulso"
          : "Mensalidade";

      const descontoValor = payload.descontoValorOverride ?? parseCurrencyInput(payload.descontos);
      const baseValor = parseCurrencyInput(payload.baseCalculo);
      const percentualValor = parseFloat(payload.percentual.replace(",", ".") || "0");
      const periodicidadeNumero = periodicidadeToNumero(payload.periodicidade);
      const parcelasNumero = payload.parcelas ? Number(payload.parcelas) : undefined;

      const boletoPayload: CreateBoletoPayload = {
        empresa_id: payload.empresaId,
        tipo: payload.tipo,
        valor: Number(valorBoleto.toFixed(2)),
        vencimento: payload.dataVencimento,
        descricao: descricaoBoleto,
        competencia_inicial: payload.competenciaInicial || undefined,
        competencia_final: payload.competenciaFinal || undefined,
        ano: payload.anoContribuicao || undefined,
        periodicidade: Number.isFinite(periodicidadeNumero) ? periodicidadeNumero : undefined,
        parcelas: Number.isFinite(parcelasNumero) ? parcelasNumero : undefined,
        descontos: descontoValor || undefined,
        percentual: percentualValor || undefined,
        base: baseValor || undefined,
        item_name: itemName,
        item_amount: 1,
        custom_id: `${payload.tipo || "boleto"}-${payload.empresaId}-${payload.anoContribuicao || payload.dataVencimento}${payload.contribuicaoParcelaNumero ? `-parcela-${payload.contribuicaoParcelaNumero}` : ""}`,
        message: payload.mensagemPersonalizada || undefined,
        customer: {
          email: emailBoleto,
          phone_number: phoneNumber,
          juridical_person: {
            corporate_name: empresa.nome,
            cnpj: empresa.cnpj.replace(/\D/g, ""),
          },
        },
      };

      await createBoletoRequest(boletoPayload);

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
              base: baseValor || null,
              percentual: percentualValor || null,
              descontos: descontoValor || null,
              valor: valorBoleto || null,
              vencimento: payload.dataVencimento || null,
              situacao: "Emitida",
              folha_repetida_ano_anterior: payload.folhaRepetidaAnoAnterior ?? false,
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
        valor: faixa.valor_mensalidade !== undefined && faixa.valor_mensalidade !== null ? Number(faixa.valor_mensalidade) : 0,
        descricao: faixa.label ?? "",
      })) ?? []
    );
  }, [data?.faixas]);

  const getValorFaixa = (faixaId?: string) => {
    if (!faixaId) return 0;
    return faixas.find((f) => f.id === faixaId)?.valor ?? 0;
  };
  const normalizeDiscountPercent = (value?: number | string | null) => {
    const numericValue = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numericValue ?? NaN)) return 0;
    return Math.min(Math.max(Number(numericValue), 0), 100);
  };
  const calcularMensalidadeComDesconto = (valorBase: number, descontoPercentual?: number | string | null) => {
    const percentual = normalizeDiscountPercent(descontoPercentual);
    const descontoValor = valorBase * (percentual / 100);
    return {
      valorBase,
      descontoPercentual: percentual,
      descontoValor,
      valorFinal: Math.max(valorBase - descontoValor, 0),
    };
  };

  const planoTrimestreAutomatico = useMemo<TrimestreAutomaticoRow[]>(() => {
    const ano = Number(trimestreAutomaticoAno);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return [];

    const trimestre = getTrimestre(ano, trimestreAutomaticoNumero);
    const janelaInicio = startOfMonth(addMonths(trimestre.inicio, -1));
    const janelaFimExclusivo = startOfMonth(addMonths(trimestre.fim, 1));

    return mockEmpresas
      .filter((empresa) => {
        if (!empresa.associada || empresa.tipoVinculo !== "Associado" || !empresa.dataAssociacao) return false;
        const dataAssociacao = parseISO(empresa.dataAssociacao);
        return isValid(dataAssociacao) && !isBefore(dataAssociacao, janelaInicio) && isBefore(dataAssociacao, janelaFimExclusivo);
      })
      .map((empresa) => {
        const dataAssociacao = parseISO(empresa.dataAssociacao);
        let primeiraCompetencia = startOfMonth(dataAssociacao);
        if (dataAssociacao.getDate() >= 28) primeiraCompetencia = startOfMonth(addMonths(primeiraCompetencia, 1));
        if (isBefore(primeiraCompetencia, trimestre.inicio)) primeiraCompetencia = trimestre.inicio;

        const competenciasEmitidas = trimestre.meses
          .filter((mes) => boletos.some((boleto) =>
            boleto.empresaId === empresa.id &&
            boleto.tipo === "Mensalidade (por Faixa)" &&
            boleto.status !== "Cancelado" &&
            rangesOverlap(format(mes, "yyyy-MM-dd"), format(mes, "yyyy-MM-dd"), boleto.competenciaInicial, boleto.competenciaFinal),
          ))
          .map((mes) => format(mes, "yyyy-MM-dd"));

        const primeiroIndiceElegivel = trimestre.meses.findIndex((mes) => !isBefore(mes, primeiraCompetencia));
        const ultimoIndiceEmitido = trimestre.meses.reduce((ultimo, mes, index) =>
          competenciasEmitidas.includes(format(mes, "yyyy-MM-dd")) ? index : ultimo, -1);
        const primeiroIndicePendente = primeiroIndiceElegivel < 0
          ? trimestre.meses.length
          : Math.max(primeiroIndiceElegivel, ultimoIndiceEmitido + 1);
        const competenciasPendentes = trimestre.meses
          .slice(primeiroIndicePendente)
          .map((mes) => format(mes, "yyyy-MM-dd"));

        const faixa = faixas.find((item) => item.id === empresa.faixaId);
        const descontoPercentual = Math.min(Math.max(Number(empresa.descontoMensalidadePercentual) || 0, 0), 100);
        const valorBase = faixa?.valor ?? 0;
        const descontoMensal = valorBase * (descontoPercentual / 100);
        const valorMensal = Math.max(valorBase - descontoMensal, 0);
        const impedimentos: string[] = [];
        if (competenciasPendentes.length > 0) {
          if (!empresa.faixaId || !faixa) impedimentos.push("faixa não cadastrada");
          else if (faixa.valor <= 0) impedimentos.push("valor da faixa inválido");
          if (!empresa.cnpj) impedimentos.push("CNPJ não cadastrado");
          if (!empresa.contatoPrincipal.email) impedimentos.push("e-mail não cadastrado");
          if (!empresa.contatoPrincipal.whatsapp) impedimentos.push("WhatsApp não cadastrado");
        }

        return {
          empresaId: empresa.id,
          empresaNome: empresa.nome,
          dataAssociacao: empresa.dataAssociacao,
          faixaId: empresa.faixaId,
          competenciasEmitidas,
          competenciasPendentes,
          valorMensal,
          descontoMensal,
          valorTotal: valorMensal * competenciasPendentes.length,
          impedimentos,
        };
      })
      .sort((a, b) => {
        if (a.competenciasPendentes.length !== b.competenciasPendentes.length) {
          return b.competenciasPendentes.length - a.competenciasPendentes.length;
        }
        return a.empresaNome.localeCompare(b.empresaNome, "pt-BR");
      });
  }, [boletos, faixas, mockEmpresas, trimestreAutomaticoAno, trimestreAutomaticoNumero]);

  const empresasAssociadasSemData = useMemo(
    () => mockEmpresas.filter((empresa) => empresa.associada && empresa.tipoVinculo === "Associado" && !empresa.dataAssociacao),
    [mockEmpresas],
  );

  const trimestreAutomaticoPendentes = planoTrimestreAutomatico.filter((row) => row.competenciasPendentes.length > 0);
  const trimestreAutomaticoImpedidas = trimestreAutomaticoPendentes.filter((row) => row.impedimentos.length > 0);
  const trimestreAutomaticoValorTotal = trimestreAutomaticoPendentes.reduce((total, row) => total + row.valorTotal, 0);
  const getEmpresaMensalidade = (empresaId?: string) => mockEmpresas.find((empresa) => empresa.id === empresaId);
  const getCompetenciasCount = (inicio?: string, fim?: string) => {
    if (!inicio || !fim) return 0;
    const start = startOfMonth(parseISO(inicio));
    const end = startOfMonth(parseISO(fim));
    if (!isValid(start) || !isValid(end) || isAfter(start, end)) return 0;
    let cursor = start;
    let total = 0;
    while (!isAfter(cursor, end)) {
      total += 1;
      cursor = addMonths(cursor, 1);
    }
    return total;
  };

  const getMensalidadePreview = () => {
    const meses = getCompetenciasCount(boletoForm.competenciaInicial, boletoForm.competenciaFinal);
    const empresaSelecionada = !isBatchMode ? getEmpresaMensalidade(boletoForm.empresaId) : undefined;
    const valorBase = empresaSelecionada && empresaSelecionada.tipoVinculo !== "Associado"
      ? empresaSelecionada.valorMensalidadeVinculo
      : getValorFaixa(boletoForm.faixaId);
    const desconto = calcularMensalidadeComDesconto(valorBase, empresaSelecionada?.descontoMensalidadePercentual);
    return {
      meses,
      valorMensal: valorBase,
      descontoPercentual: desconto.descontoPercentual,
      descontoValorMensal: desconto.descontoValor,
      valorMensalComDesconto: desconto.valorFinal,
      valorTotal: desconto.valorFinal * Math.max(meses, 1),
    };
  };

  const saveFaixaMutation = useMutation({
    mutationFn: async (payload: { id?: string; min: number; max: number; valor: number; descricao?: string }) => {
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
              label: payload.descricao ?? null,
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
            label: payload.descricao ?? null,
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
  const [faixaForm, setFaixaForm] = useState({ valor: "", descricao: "" });
  const [boletosPage, setBoletosPage] = useState(1);
  const [boletosPageSize, setBoletosPageSize] = useState(50);
  const [comunicacaoDialogOpen, setComunicacaoDialogOpen] = useState(false);
  const [selectedEmpresaComunicacao, setSelectedEmpresaComunicacao] = useState("");
  const [novaNotaComunicacao, setNovaNotaComunicacao] = useState("");
  const [isSavingNotaComunicacao, setIsSavingNotaComunicacao] = useState(false);
  const [emailFallbackDialogOpen, setEmailFallbackDialogOpen] = useState(false);
  const [emailFallbackEmpresaIds, setEmailFallbackEmpresaIds] = useState<string[]>([]);
  const [emailFallbackDraft, setEmailFallbackDraft] = useState("");
  const [isResolvingEmailFallback, setIsResolvingEmailFallback] = useState(false);

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
    baseCalculoAgosto: "",
    quantidadeParcelasContribuicao: 2,
    vencimentoParcela1: "",
    vencimentoParcela2: "",
    valorAvulso: "",
    motivoCobranca: "",
  });
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchEmpresaIds, setBatchEmpresaIds] = useState<string[]>([]);
  const [batchFaixaId, setBatchFaixaId] = useState("");
  const [batchTipoVinculo, setBatchTipoVinculo] = useState<"Associado" | "Mantenedor" | "Parceiro" | "Fornecedor">("Associado");
  const [contribuicaoLoteRows, setContribuicaoLoteRows] = useState<ContribuicaoLoteRow[]>([]);
  const [empresaContribuicaoParaAdicionar, setEmpresaContribuicaoParaAdicionar] = useState("");
  const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false);
  const [previaBoleto, setPreviaBoleto] = useState<number | null>(null);
  const [contribuicaoPreview, setContribuicaoPreview] = useState("");

  const { data: empresasPorFaixaData, isLoading: isLoadingEmpresasPorFaixa } = useQuery({
    queryKey: ["empresas-por-faixa", batchFaixaId],
    enabled: isBatchMode && !!batchFaixaId,
    queryFn: () =>
      hasuraRequest<{ empresas: EmpresaLookupRow[] }>({
        query: EMPRESAS_POR_FAIXA_QUERY,
        variables: { faixaId: batchFaixaId },
        token,
      }),
  });

  useEffect(() => {
    const savedBatch = localStorage.getItem("financeiro:lote-empresas");
    if (savedBatch) {
      try {
        const parsed = JSON.parse(savedBatch);
        if (Array.isArray(parsed)) setBatchEmpresaIds(parsed);
      } catch {
        // noop
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("financeiro:lote-empresas", JSON.stringify(batchEmpresaIds));
  }, [batchEmpresaIds]);

  useEffect(() => {
    if (searchParams.get("wizard") === "novo-boleto") {
      setWizardOpen(true);
      setWizardStep(1);
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete("wizard");
      setSearchParams(updatedParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Helper to parse due dates coming from Hasura (yyyy-MM-dd) or already formatted UI values.
  const parseVencimento = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    const trimmedDate = dateStr.trim();
    const isoDate = parseISO(trimmedDate);
    if (isValid(isoDate)) return isoDate;

    const supportedFormats = ["dd/MM/yyyy", "dd-MM-yyyy"];
    for (const dateFormat of supportedFormats) {
      const parsedDate = parse(trimmedDate, dateFormat, new Date());
      if (isValid(parsedDate)) return parsedDate;
    }

    return null;
  };

  // Determine boleto effective status for UI
  const getBoletoEffectiveStatus = (boleto: BoletoRegistro): string => {
    if (boleto.status === "Pago" || boleto.status === "Cancelado") return boleto.status;
    const dueDate = parseVencimento(boleto.vencimento);
    if (dueDate && isBefore(dueDate, new Date())) {
      return "Inadimplente";
    }
    return normalizeBoletoStatus(boleto.status);
  };

  const handleDownloadBoleto = (boleto: BoletoView) => {
    const pdfUrl = boleto.pdfUrl?.trim();

    if (!pdfUrl) {
      toast({
        title: "PDF indisponível",
        description: "Este boleto não possui pdf_url para download.",
        variant: "destructive",
      });
      return;
    }

    const openedWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      toast({
        title: "Não foi possível abrir o PDF",
        description: "Autorize pop-ups no navegador e tente baixar o boleto novamente.",
        variant: "destructive",
      });
    }
  };

  const buildBoletoMessage = (boleto: BoletoView) => {
    const competencia = getCompetenciaRangeLabel(boleto.competenciaInicial, boleto.competenciaFinal);
    const competenciaTexto = competencia ? ` referente à competência ${competencia}` : "";
    const vencimento = formatDateBR(boleto.vencimento) || boleto.vencimento;
    const pdfUrl = boleto.pdfUrl?.trim();

    return [
      `Olá! Segue o boleto ${boleto.tipo}${competenciaTexto} da empresa ${boleto.empresa}.`,
      `Valor: ${formatCurrencyBRL(boleto.valor)}.`,
      vencimento ? `Vencimento: ${vencimento}.` : "",
      pdfUrl ? `Acesse o boleto em: ${pdfUrl}` : "",
      "Em caso de dúvidas, estamos à disposição.",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const markBoletoEmailSent = async (boletoId: string, destinatario: string) => {
    await hasuraRequest({
      query: UPDATE_BOLETO_ENVIO_EMAIL_HASURA,
      variables: { id: boletoId, enviadoEm: new Date().toISOString(), destinatario },
      token,
    });
  };

  const markBoletoWhatsappSent = async (boletoId: string, destinatario: string) => {
    await hasuraRequest({
      query: UPDATE_BOLETO_ENVIO_WHATSAPP_HASURA,
      variables: { id: boletoId, enviadoEm: new Date().toISOString(), destinatario },
      token,
    });
  };

  const handleSendBoletoEmail = async (boleto: BoletoView, email?: string) => {
    const destinatario = email?.trim();
    const chargeId = boleto.efiChargeId ? Number(boleto.efiChargeId) : extractChargeId(boleto.id);

    if (!chargeId) {
      toast({ title: "Boleto sem charge_id", description: "Não foi possível reenviar por e-mail sem charge_id da EFI.", variant: "destructive" });
      return;
    }

    if (!destinatario) {
      toast({ title: "E-mail ausente", description: "Cadastre um e-mail na empresa antes de enviar o boleto.", variant: "destructive" });
      return;
    }

    try {
      setSendingBoletoCommunication(`${boleto.id}:email`);
      await resendBoletoEmailRequest(chargeId, destinatario);
      await markBoletoEmailSent(boleto.id, destinatario);
      await appendObservacaoEmpresa(boleto.empresa, `Boleto (${boleto.id}) enviado por e-mail para ${destinatario}.`);
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
      toast({ title: "Boleto enviado por e-mail", description: `Envio registrado para ${destinatario}.` });
    } catch (err) {
      toast({
        title: "Falha ao enviar por e-mail",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSendingBoletoCommunication(null);
    }
  };

  const handleSendBoletoWhatsapp = async (boleto: BoletoView, whatsapp?: string) => {
    const digits = whatsapp?.replace(/\D/g, "") ?? "";

    if (!digits) {
      toast({ title: "WhatsApp ausente", description: "Cadastre um WhatsApp na empresa antes de enviar o boleto.", variant: "destructive" });
      return;
    }

    if (!boleto.pdfUrl?.trim()) {
      toast({ title: "PDF indisponível", description: "Este boleto não possui pdf_url para envio por WhatsApp.", variant: "destructive" });
      return;
    }

    try {
      const destinatario = normalizeBrazilianWhatsappNumber(digits);
      setSendingBoletoCommunication(`${boleto.id}:whatsapp`);
      await sendEvolutionTextRequest({ number: destinatario, text: buildBoletoMessage(boleto) });
      await markBoletoWhatsappSent(boleto.id, destinatario);
      await appendObservacaoEmpresa(boleto.empresa, `Boleto (${boleto.id}) enviado por WhatsApp para ${destinatario}.`);
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
      toast({ title: "Boleto enviado por WhatsApp", description: `Envio registrado para ${destinatario}.` });
    } catch (err) {
      toast({
        title: "Falha ao enviar por WhatsApp",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSendingBoletoCommunication(null);
    }
  };

  const startBoletoReplication = (boleto: BoletoView) => {
    setSelectedBoletoForReplication(boleto);
    setReplicateCancelAfter(false);
    setReplicateCancelReason("Boleto replicado e cancelado após nova emissão.");
    setReplicateDialogOpen(true);
  };

  const continueBoletoReplication = () => {
    if (!selectedBoletoForReplication) return;
    setSelectedBoletoForNew({
      id: selectedBoletoForReplication.id,
      empresa: selectedBoletoForReplication.empresa,
      vencimento: selectedBoletoForReplication.vencimento,
      valor: selectedBoletoForReplication.valor,
    });
    setReplicateDialogOpen(false);
    setGerarNovoOpen(true);
  };

  const cancelReplicatedOriginalBoleto = async (boleto: BoletoView) => {
    const reason = replicateCancelReason.trim() || "Boleto replicado e cancelado após nova emissão.";
    const chargeId = boleto.efiChargeId ? Number(boleto.efiChargeId) : extractChargeId(boleto.id);

    if (chargeId) {
      await cancelBoletoRequest(chargeId);
    }

    await syncStatusInHasura(boleto.id, "cancelado");
    await syncDescricaoInHasura(boleto.id, `Cancelado: ${reason}`);
    await appendObservacaoEmpresa(boleto.empresa, `Cancelamento de boleto (${boleto.id}) após replicação: ${reason}`);
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
        if ((f.dataInicio || f.dataFim) && !dueDate) {
          return false;
        }
        if (dueDate) {
          const dueDateDay = startOfDay(dueDate);
          if (f.dataInicio && isBefore(dueDateDay, startOfDay(f.dataInicio))) {
            return false;
          }
          if (f.dataFim && isAfter(dueDateDay, endOfDay(f.dataFim))) {
            return false;
          }
        }

        // Somente inadimplentes
        if (f.somenteInadimplentes) {
          const effectiveStatus = getBoletoEffectiveStatus(boleto);
          if (effectiveStatus !== "Inadimplente") {
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

  const paginatedBoletos = useMemo(() => {
    const start = (boletosPage - 1) * boletosPageSize;
    return filteredBoletos.slice(start, start + boletosPageSize);
  }, [filteredBoletos, boletosPage, boletosPageSize]);

  const canProceed = (() => {
    if (wizardStep === 1) {
      if (boletoForm.tipo === "contribuicao") return true;
      return !!(boletoForm.tipo && (isBatchMode ? batchEmpresaIds.length > 0 : boletoForm.empresaId));
    }

    if (wizardStep === 2) {
      if (boletoForm.tipo === "mensalidade") {
        const selectedCompanies = isBatchMode
          ? mockEmpresas.filter((empresa) => batchEmpresaIds.includes(empresa.id))
          : mockEmpresas.filter((empresa) => empresa.id === boletoForm.empresaId);
        const requiresFaixa = selectedCompanies.some((empresa) => empresa.tipoVinculo === "Associado");
        const validValues = selectedCompanies.every((empresa) =>
          empresa.tipoVinculo === "Associado" || empresa.valorMensalidadeVinculo > 0,
        );
        return !!(boletoForm.competenciaInicial && boletoForm.competenciaFinal && boletoForm.dataVencimento && (!requiresFaixa || boletoForm.faixaId) && validValues);
      }
      if (boletoForm.tipo === "avulso") {
        return !!(boletoForm.dataVencimento && boletoForm.motivoCobranca.trim() && parseCurrencyInput(boletoForm.valorAvulso) > 0);
      }
      if (boletoForm.tipo === "contribuicao") {
        return isContribuicaoLoteValido();
      }

      return false;
    }

    return true;
  })();

  const handleExport = async (formato: "PDF" | "Excel" | "CSV") => {
    const now = new Date();
    const arquivoBase = `financeiro-boletos-${format(now, "yyyy-MM-dd")}`;
    const rows = filteredBoletos.map((b) => ({
      empresa: b.empresa,
      tipo: b.tipo,
      valor: b.valor,
      vencimento: b.vencimento,
      status: getBoletoEffectiveStatus(b),
    }));

    if (rows.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "Não existem boletos para os filtros selecionados.",
      });
      return;
    }

    if (formato === "PDF") {
      try {
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const verdeEscuro: [number, number, number] = [126, 140, 94];
        const verdeClaro: [number, number, number] = [247, 248, 244];
        const borda: [number, number, number] = [220, 231, 203];

        doc.setFillColor(...verdeEscuro);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, "F");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("Relatório Financeiro de Boletos", 40, 38);

        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(`Gerado em ${format(now, "dd/MM/yyyy HH:mm")} • Total: ${rows.length} boleto(s)`, 40, 80);

        autoTable(doc, {
          startY: 95,
          head: [["Empresa", "Tipo", "Valor", "Vencimento", "Status"]],
          body: rows.map((row) => [
            row.empresa,
            row.tipo,
            formatCurrencyBRL(row.valor),
            row.vencimento,
            row.status,
          ]),
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 8,
            lineColor: borda,
            lineWidth: 0.5,
            textColor: [28, 28, 28],
          },
          headStyles: {
            fillColor: verdeEscuro,
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: verdeClaro,
          },
        });

        doc.save(`${arquivoBase}.pdf`);
        toast({
          title: "PDF exportado com sucesso",
          description: `${rows.length} boleto(s) exportado(s).`,
        });
      } catch (error) {
        toast({
          title: "Falha ao exportar PDF",
          description: error instanceof Error ? error.message : "Não foi possível gerar o PDF.",
          variant: "destructive",
        });
      }
      return;
    }

    if (formato === "Excel") {
      try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Boletos");

        worksheet.columns = [
          { header: "Empresa", key: "empresa", width: 42 },
          { header: "Tipo", key: "tipo", width: 28 },
          { header: "Valor", key: "valor", width: 16 },
          { header: "Vencimento", key: "vencimento", width: 16 },
          { header: "Status", key: "status", width: 18 },
        ];

        rows.forEach((row) => {
          worksheet.addRow({
            ...row,
            valor: row.valor,
          });
        });

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 24;
        headerRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7E8C5E" } };
          cell.border = {
            top: { style: "thin", color: { argb: "FFDCE7CB" } },
            left: { style: "thin", color: { argb: "FFDCE7CB" } },
            bottom: { style: "thin", color: { argb: "FFDCE7CB" } },
            right: { style: "thin", color: { argb: "FFDCE7CB" } },
          };
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          row.height = 22;
          const isEven = rowNumber % 2 === 0;
          row.eachCell((cell, colNumber) => {
            cell.alignment = { vertical: "middle", horizontal: colNumber === 3 ? "right" : "left" };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: isEven ? "FFF7F8F4" : "FFFFFFFF" },
            };
            cell.border = {
              top: { style: "thin", color: { argb: "FFDCE7CB" } },
              left: { style: "thin", color: { argb: "FFDCE7CB" } },
              bottom: { style: "thin", color: { argb: "FFDCE7CB" } },
              right: { style: "thin", color: { argb: "FFDCE7CB" } },
            };
          });
        });

        worksheet.getColumn("valor").numFmt = '"R$"#,##0.00';

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${arquivoBase}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Excel exportado com sucesso",
          description: `${rows.length} boleto(s) exportado(s).`,
        });
      } catch (error) {
        toast({
          title: "Falha ao exportar Excel",
          description: error instanceof Error ? error.message : "Não foi possível gerar o arquivo XLSX.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Formato não suportado",
      description: "Exportação CSV ainda não foi implementada.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case "Aguardando":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Aguardando</Badge>;
      case "Cancelado":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Cancelado</Badge>;
      case "Inadimplente":
        return <Badge variant="destructive">Inadimplente</Badge>;
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
        valor: faixa.valor.toString(),
        descricao: faixa.descricao ?? "",
      });
    } else {
      setFaixaToEdit(null);
      setFaixaForm({ valor: "", descricao: "" });
    }
    setFaixaDialogOpen(true);
  };

  const handleSaveFaixa = () => {
    if (!faixaForm.descricao.trim()) {
      toast({ title: "Erro", description: "A descrição da faixa é obrigatória.", variant: "destructive" });
      return;
    }
    const valor = parseFloat(faixaForm.valor);

    if (isNaN(valor)) {
      toast({
        title: "Erro",
        description: "O valor da faixa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    saveFaixaMutation.mutate(
      { id: faixaToEdit?.id, min: 0, max: 0, valor, descricao: faixaForm.descricao },
      {
        onSuccess: () => {
          toast({
            title: faixaToEdit ? "Faixa atualizada" : "Faixa criada",
            description: faixaToEdit
              ? "A faixa foi atualizada com sucesso."
              : "A nova faixa foi criada com sucesso.",
          });
          setFaixaDialogOpen(false);
          setFaixaForm({ valor: "", descricao: "" });
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
      baseCalculoAgosto: "",
      quantidadeParcelasContribuicao: 2,
      vencimentoParcela1: "",
      vencimentoParcela2: "",
      valorAvulso: "",
      motivoCobranca: "",
    });
    setEmpresaSearch("");
    setIsBatchMode(false);
    setBatchTipoVinculo("Associado");
    setContribuicaoLoteRows([]);
    setEmpresaContribuicaoParaAdicionar("");
    setPreviaBoleto(null);
    setContribuicaoPreview("");
    setBatchEmissionProgress({ done: 0, total: 0 });
    setEmailFallbackDialogOpen(false);
    setEmailFallbackEmpresaIds([]);
    setEmailFallbackDraft("");
  };

  const handleSelectEmpresa = (empresa: typeof mockEmpresas[0]) => {
    setBoletoForm((prev) => ({
      ...prev,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
      faixaId: empresa.faixaId || "",
    }));
    setEmpresaSearch(`${empresa.nome} - ${empresa.cnpj}`);
    setShowEmpresaSuggestions(false);

    if (!empresa.faixaId) {
      toast({
        title: "Empresa sem faixa cadastrada",
        description: "Selecione uma faixa na próxima etapa ou edite o cadastro completo da empresa antes de emitir.",
        variant: "destructive",
      });
    }
  };

  const empresasFiltradas = mockEmpresas.filter((emp) => {
    const term = empresaSearch.toLowerCase();
    const matchesSearch =
      emp.nome.toLowerCase().includes(term) ||
      emp.razaoSocial.toLowerCase().includes(term) ||
      emp.nomeFantasia.toLowerCase().includes(term) ||
      emp.cnpj.includes(empresaSearch);
    const matchesBatchTipo = !isBatchMode || emp.tipoVinculo === batchTipoVinculo;
    const matchesBatchFaixa = !isBatchMode || batchTipoVinculo !== "Associado" || !batchFaixaId || emp.faixaId === batchFaixaId;
    return matchesSearch && matchesBatchTipo && matchesBatchFaixa;
  });
  const empresasDoVinculoSelecionado = useMemo(
    () => mockEmpresas.filter((empresa) =>
      empresa.tipoVinculo === batchTipoVinculo &&
      (batchTipoVinculo !== "Associado" || !batchFaixaId || empresa.faixaId === batchFaixaId)),
    [batchFaixaId, batchTipoVinculo, mockEmpresas],
  );
  const empresasDaFaixaSelecionada = useMemo(() => {
    if (!batchFaixaId) return [];
    return (
      empresasPorFaixaData?.empresas.map((empresa) => ({
        id: empresa.id,
        nome: empresa.nome_fantasia?.trim() || empresa.razao_social,
        razaoSocial: empresa.razao_social,
        nomeFantasia: empresa.nome_fantasia ?? "",
        faixaId: empresa.faixa_id ?? "",
        descontoMensalidadePercentual: Number(empresa.desconto_mensalidade_percentual ?? 0),
        cnpj: empresa.cnpj ?? "",
        qtdFuncionarios: empresa.qtd_funcionarios ?? empresa.colaboradores?.length ?? 0,
        contatoPrincipal: chooseBoletoContact(empresa),
      })) ?? []
    );
  }, [batchFaixaId, empresasPorFaixaData?.empresas]);

  function parseCurrencyInput(value: string) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  }

  function buildContribuicaoRowsFromPreviousYear(ano: string): ContribuicaoLoteRow[] {
    const anoAnterior = String(Number(ano) - 1);
    if (!/^\d{4}$/.test(ano) || !data?.contribuicoes_assistenciais) return [];
    const basesPorEmpresa = new Map<string, number>();
    for (const contribuicao of data.contribuicoes_assistenciais) {
      const empresaId = contribuicao.empresa?.id;
      if (!empresaId || contribuicao.ano !== anoAnterior || contribuicao.situacao?.toLowerCase() === "cancelada") continue;
      basesPorEmpresa.set(empresaId, (basesPorEmpresa.get(empresaId) ?? 0) + Number(contribuicao.base ?? 0));
    }
    return Array.from(basesPorEmpresa.entries())
      .map(([empresaId, folhaAnoAnterior]) => {
        const empresa = mockEmpresas.find((item) => item.id === empresaId);
        return empresa ? {
          empresaId,
          empresaNome: empresa.nome,
          folhaAnoAnterior,
          folhaAtual: "",
          repetiuFolhaAnterior: false,
          quantidadeParcelas: 2 as const,
        } : null;
      })
      .filter((row): row is ContribuicaoLoteRow => Boolean(row))
      .sort((a, b) => a.empresaNome.localeCompare(b.empresaNome, "pt-BR"));
  }

  function getContribuicaoParcelas(form: BoletoForm) {
    const percentual = Number(form.percentual.replace(",", "."));
    const baseAgosto = parseCurrencyInput(form.baseCalculoAgosto);
    const descontos = parseCurrencyInput(form.descontos);
    const primeiroVencimento = parseISO(form.vencimentoParcela1);
    const segundoVencimento = parseISO(form.vencimentoParcela2);
    const quantidade = form.quantidadeParcelasContribuicao;
    if (
      !/^\d{4}$/.test(form.anoContribuicao) ||
      !Number.isFinite(percentual) ||
      percentual <= 0 ||
      baseAgosto <= 0 ||
      !isValid(primeiroVencimento) ||
      (quantidade === 2 && (!isValid(segundoVencimento) || !isAfter(segundoVencimento, primeiroVencimento)))
    ) return [];

    const valorTotal = Math.max((baseAgosto * percentual) / 100 - descontos, 0);
    if (valorTotal <= 0) return [];
    if (quantidade === 1) {
      return [{
        numero: 1 as const,
        totalParcelas: 1 as const,
        competencia: `${form.anoContribuicao}-08-01`,
        base: baseAgosto,
        desconto: descontos,
        valor: Number(valorTotal.toFixed(2)),
        vencimento: form.vencimentoParcela1,
      }];
    }

    const primeiraParcela = Math.floor((valorTotal * 100) / 2) / 100;
    const segundaParcela = Number((valorTotal - primeiraParcela).toFixed(2));
    const primeiraBase = Math.floor((baseAgosto * 100) / 2) / 100;
    const segundaBase = Number((baseAgosto - primeiraBase).toFixed(2));
    const primeiroDesconto = Math.floor((descontos * 100) / 2) / 100;
    const segundoDesconto = Number((descontos - primeiroDesconto).toFixed(2));
    return [
      { numero: 1 as const, totalParcelas: 2 as const, competencia: `${form.anoContribuicao}-08-01`, base: primeiraBase, desconto: primeiroDesconto, valor: primeiraParcela, vencimento: form.vencimentoParcela1 },
      { numero: 2 as const, totalParcelas: 2 as const, competencia: `${form.anoContribuicao}-08-01`, base: segundaBase, desconto: segundoDesconto, valor: segundaParcela, vencimento: form.vencimentoParcela2 },
    ];
  }

  function isContribuicaoLoteValido() {
    const percentual = Number(boletoForm.percentual.replace(",", "."));
    const primeiroVencimento = parseISO(boletoForm.vencimentoParcela1);
    const segundoVencimento = parseISO(boletoForm.vencimentoParcela2);
    const exigeSegundaParcela = contribuicaoLoteRows.some((row) => row.quantidadeParcelas === 2);
    return /^\d{4}$/.test(boletoForm.anoContribuicao) &&
      Number.isFinite(percentual) && percentual > 0 &&
      contribuicaoLoteRows.length > 0 &&
      contribuicaoLoteRows.every((row) => parseCurrencyInput(row.folhaAtual) > 0) &&
      isValid(primeiroVencimento) &&
      (!exigeSegundaParcela || (isValid(segundoVencimento) && isAfter(segundoVencimento, primeiroVencimento)));
  }

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
      const total = getContribuicaoParcelas(boletoForm).reduce((sum, parcela) => sum + parcela.valor, 0);
      setBoletoForm((prev) => prev.valorCalculado === total ? prev : { ...prev, valorCalculado: total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletoForm.anoContribuicao, boletoForm.baseCalculoAgosto, boletoForm.descontos, boletoForm.percentual, boletoForm.quantidadeParcelasContribuicao, boletoForm.tipo, boletoForm.vencimentoParcela1, boletoForm.vencimentoParcela2]);

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!boletoForm.tipo || (boletoForm.tipo !== "contribuicao" && ((!isBatchMode && !boletoForm.empresaId) || (isBatchMode && batchEmpresaIds.length === 0)))) {
        toast({
          title: "Campos obrigatórios",
          description: "Selecione o tipo de boleto e uma empresa.",
          variant: "destructive",
        });
        return;
      }
    } else if (wizardStep === 2) {
      if (boletoForm.tipo === "mensalidade") {
        const selectedCompanies = isBatchMode
          ? mockEmpresas.filter((empresa) => batchEmpresaIds.includes(empresa.id))
          : mockEmpresas.filter((empresa) => empresa.id === boletoForm.empresaId);
        const requiresFaixa = selectedCompanies.some((empresa) => empresa.tipoVinculo === "Associado");
        const withoutValue = selectedCompanies.filter((empresa) => empresa.tipoVinculo !== "Associado" && empresa.valorMensalidadeVinculo <= 0);
        if (!boletoForm.competenciaInicial || !boletoForm.competenciaFinal || !boletoForm.dataVencimento || (requiresFaixa && !boletoForm.faixaId) || withoutValue.length > 0) {
          toast({
            title: "Campos obrigatórios",
            description: withoutValue.length > 0
              ? `Cadastre o valor mensal de: ${withoutValue.map((empresa) => empresa.nome).join(", ")}.`
              : "Preencha competências, vencimento e a faixa dos associados para avançar.",
            variant: "destructive",
          });
          return;
        }
      } else if (boletoForm.tipo === "avulso") {
        if (!boletoForm.dataVencimento || !boletoForm.motivoCobranca.trim() || parseCurrencyInput(boletoForm.valorAvulso) <= 0) {
          toast({
            title: "Campos obrigatórios",
            description: "Informe vencimento, valor e motivo da cobrança para avançar.",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (!isContribuicaoLoteValido()) {
          toast({
            title: "Campos obrigatórios",
            description: "Preencha as folhas, a quantidade de parcelas e os vencimentos necessários para todas as empresas.",
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
      valorAvulso: "",
      motivoCobranca: "",
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
      baseCalculoAgosto: "",
      quantidadeParcelasContribuicao: 2,
      vencimentoParcela1: "",
      vencimentoParcela2: "",
    }));
    setContribuicaoPreview("");
  };

  const hasBoletoOverlap = (empresaId: string, competenciaInicial: string, competenciaFinal: string) => {
    return boletos.some((boleto) => {
      if (boleto.empresaId !== empresaId) return false;
      if (boleto.tipo !== "Mensalidade (por Faixa)") return false;
      if (boleto.status === "Cancelado") return false;
      return rangesOverlap(competenciaInicial, competenciaFinal, boleto.competenciaInicial, boleto.competenciaFinal);
    });
  };

  const updateContribuicaoLoteRow = (empresaId: string, patch: Partial<ContribuicaoLoteRow>) => {
    setContribuicaoLoteRows((rows) => rows.map((row) => row.empresaId === empresaId ? { ...row, ...patch } : row));
  };

  const addEmpresaAoLoteContribuicao = () => {
    const empresa = mockEmpresas.find((item) => item.id === empresaContribuicaoParaAdicionar);
    if (!empresa || contribuicaoLoteRows.some((row) => row.empresaId === empresa.id)) return;
    setContribuicaoLoteRows((rows) => [...rows, {
      empresaId: empresa.id,
      empresaNome: empresa.nome,
      folhaAnoAnterior: 0,
      folhaAtual: "",
      repetiuFolhaAnterior: false,
      quantidadeParcelas: 2,
    }].sort((a, b) => a.empresaNome.localeCompare(b.empresaNome, "pt-BR")));
    setEmpresaContribuicaoParaAdicionar("");
  };

  const hasContribuicaoParcela = (empresaId: string, ano: string, parcela: 1 | 2, total: 1 | 2) => {
    const marcador = total === 1 ? "(boleto único)" : `(${parcela}ª parcela de 2)`;
    const marcadorLegado = total === 2 ? `Parcela ${parcela}/2` : "";
    return boletos.some((boleto) =>
      boleto.empresaId === empresaId &&
      boleto.tipo === "Contribuição Assistencial" &&
      boleto.status !== "Cancelado" &&
      boleto.ano === ano &&
      (boleto.descricao.includes(marcador) || Boolean(marcadorLegado && boleto.descricao.includes(marcadorLegado))),
    );
  };

  const getEmpresasSemEmail = (empresas: typeof mockEmpresas, emailOverrides: Record<string, string>) => {
    return empresas.filter((empresa) => !(emailOverrides[empresa.id] || empresa.contatoPrincipal.email));
  };

  const updateEmpresaEmails = async (empresaIds: string[], email: string) => {
    await Promise.all(
      empresaIds.map((empresaId) =>
        hasuraRequest({
          query: `
            mutation UpdateEmpresaEmail($id: uuid!, $email: String!) {
              update_empresas_by_pk(pk_columns: { id: $id }, _set: { email: $email }) { id }
            }
          `,
          variables: { id: empresaId, email },
          token,
        }),
      ),
    );
    await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
  };

  const handleResolveMissingEmail = async (email: string, shouldPersist: boolean) => {
    if (!emailFallbackEmpresaIds.length) return;
    if (!email.trim()) {
      toast({ title: "E-mail obrigatório", description: "Informe um e-mail ou use o e-mail do sindicato.", variant: "destructive" });
      return;
    }

    try {
      setIsResolvingEmailFallback(true);
      if (shouldPersist) {
        await updateEmpresaEmails(emailFallbackEmpresaIds, email.trim());
      }
      const emailOverrides = Object.fromEntries(emailFallbackEmpresaIds.map((empresaId) => [empresaId, email.trim()]));
      setEmailFallbackDialogOpen(false);
      setEmailFallbackEmpresaIds([]);
      setEmailFallbackDraft("");
      await handleEmitirBoleto({ emailOverrides });
    } catch (err) {
      toast({
        title: "Falha ao resolver e-mail",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsResolvingEmailFallback(false);
    }
  };

  const handleEmitirBoleto = async (options?: { emailOverrides?: Record<string, string> }) => {
    const selectedIds = boletoForm.tipo === "contribuicao"
      ? new Set(contribuicaoLoteRows.map((row) => row.empresaId))
      : isBatchMode ? new Set(batchEmpresaIds) : new Set([boletoForm.empresaId]);
    const targetEmpresas = mockEmpresas.filter((empresa) => selectedIds.has(empresa.id));
    const emailOverrides = options?.emailOverrides ?? {};
    const empresasSemEmail = getEmpresasSemEmail(targetEmpresas, emailOverrides);
    if (empresasSemEmail.length > 0) {
      setEmailFallbackEmpresaIds(empresasSemEmail.map((empresa) => empresa.id));
      setEmailFallbackDraft("");
      setEmailFallbackDialogOpen(true);
      return;
    }
    const buildCompetencias = (inicio: string, fim: string) => {
      const start = startOfMonth(parseISO(inicio));
      const end = startOfMonth(parseISO(fim));
      if (!isValid(start) || !isValid(end) || isAfter(start, end)) return [] as string[];
      const competencias: string[] = [];
      let cursor = start;
      while (!isAfter(cursor, end)) {
        competencias.push(format(cursor, "yyyy-MM-dd"));
        cursor = addMonths(cursor, 1);
      }
      return competencias;
    };
    let parcelasContribuicaoEmitidas = 0;

    try {
      setIsEmittingBoletos(true);
      setBatchEmissionProgress({ done: 0, total: 0 });
      if (boletoForm.tipo === "mensalidade") {
        const competencias = buildCompetencias(boletoForm.competenciaInicial, boletoForm.competenciaFinal);
        if (competencias.length === 0) {
          throw new Error("Competências inválidas. Verifique as datas inicial e final.");
        }

        const foraDaFaixa = targetEmpresas.filter((empresa) =>
          empresa.tipoVinculo === "Associado" && empresa.faixaId !== boletoForm.faixaId,
        );
        if (foraDaFaixa.length > 0) {
          throw new Error(`Há empresa(s) fora da faixa selecionada: ${foraDaFaixa.map((empresa) => empresa.nome).join(", ")}.`);
        }

        const duplicadas = targetEmpresas.filter((empresa) =>
          hasBoletoOverlap(empresa.id, boletoForm.competenciaInicial, boletoForm.competenciaFinal),
        );
        if (duplicadas.length > 0) {
          throw new Error(`Já existe boleto de mensalidade para a competência selecionada: ${duplicadas.map((empresa) => empresa.nome).join(", ")}.`);
        }

        if (isBatchMode && targetEmpresas.some((empresa) => empresa.tipoVinculo === "Associado")) {
          const trimestreAtual = getCurrentQuarterRange();
          const emitidasNoTrimestre = targetEmpresas.filter((empresa) =>
            hasBoletoOverlap(empresa.id, trimestreAtual.start, trimestreAtual.end),
          );
          if (emitidasNoTrimestre.length > 0) {
            throw new Error(`Emissão em lote bloqueada para empresa(s) com boleto emitido no trimestre corrente: ${emitidasNoTrimestre.map((empresa) => empresa.nome).join(", ")}.`);
          }
        }

        const totalOperacoes = boletoForm.unificarCompetencias === "Sim" ? targetEmpresas.length : targetEmpresas.length * competencias.length;
        setBatchEmissionProgress({ done: 0, total: totalOperacoes });
        const emitir = async (payload: BoletoForm) => {
          await createBoletoMutation.mutateAsync(payload);
          setBatchEmissionProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        };

        if (boletoForm.unificarCompetencias === "Sim") {
          for (const empresa of targetEmpresas) {
            const valorBase = empresa.tipoVinculo === "Associado"
              ? getValorFaixa(boletoForm.faixaId)
              : empresa.valorMensalidadeVinculo;
            const mensalidade = calcularMensalidadeComDesconto(valorBase, empresa.descontoMensalidadePercentual);
            await emitir({
              ...boletoForm,
              empresaId: empresa.id,
              empresaNome: empresa.nome,
              valorOverride: mensalidade.valorFinal * competencias.length,
              descontoValorOverride: mensalidade.descontoValor * competencias.length,
              emailOverride: emailOverrides[empresa.id],
              mensagemPersonalizada: boletoForm.mensagemPersonalizada || `Boleto referente à competência ${getCompetenciaRangeLabel(boletoForm.competenciaInicial, boletoForm.competenciaFinal)}`,
            });
          }
        } else {
          for (const empresa of targetEmpresas) {
            const valorBase = empresa.tipoVinculo === "Associado"
              ? getValorFaixa(boletoForm.faixaId)
              : empresa.valorMensalidadeVinculo;
            const mensalidade = calcularMensalidadeComDesconto(valorBase, empresa.descontoMensalidadePercentual);
            for (const competencia of competencias) {
              await emitir({
                ...boletoForm,
                empresaId: empresa.id,
                empresaNome: empresa.nome,
                competenciaInicial: competencia,
                competenciaFinal: competencia,
                valorOverride: mensalidade.valorFinal,
                descontoValorOverride: mensalidade.descontoValor,
                emailOverride: emailOverrides[empresa.id],
                mensagemPersonalizada: boletoForm.mensagemPersonalizada || `Boleto referente à competência ${getCompetenciaRangeLabel(competencia, competencia)}`,
              });
            }
          }
        }
      } else if (boletoForm.tipo === "contribuicao") {
        const tarefas: { empresa: (typeof mockEmpresas)[number]; form: BoletoForm; parcela: ReturnType<typeof getContribuicaoParcelas>[number] }[] = [];
        for (const row of contribuicaoLoteRows) {
          const empresa = targetEmpresas.find((item) => item.id === row.empresaId);
          if (!empresa) continue;
          const form = {
            ...boletoForm,
            empresaId: empresa.id,
            empresaNome: empresa.nome,
            baseCalculoAgosto: row.folhaAtual,
            quantidadeParcelasContribuicao: row.quantidadeParcelas,
            folhaRepetidaAnoAnterior: row.repetiuFolhaAnterior,
          };
          const parcelas = getContribuicaoParcelas(form);
          if (parcelas.length !== row.quantidadeParcelas) throw new Error(`Dados inválidos para ${empresa.nome}.`);
          for (const parcela of parcelas) {
            if (!hasContribuicaoParcela(empresa.id, boletoForm.anoContribuicao, parcela.numero, parcela.totalParcelas)) {
              tarefas.push({ empresa, form, parcela });
            }
          }
        }
        if (tarefas.length === 0) throw new Error(`Todos os boletos da contribuição de ${boletoForm.anoContribuicao} já foram emitidos.`);
        setBatchEmissionProgress({ done: 0, total: tarefas.length });
        for (const { empresa, form, parcela } of tarefas) {
          const descricao = getDescricaoContribuicao(boletoForm.anoContribuicao, parcela.numero, parcela.totalParcelas);
          await createBoletoMutation.mutateAsync({
            ...form,
            empresaId: empresa.id,
            empresaNome: empresa.nome,
            dataVencimento: parcela.vencimento,
            competenciaInicial: parcela.competencia,
            competenciaFinal: parcela.competencia,
            periodicidade: "Anual",
            parcelas: String(parcela.totalParcelas),
            baseCalculo: parcela.base.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 2 }),
            descontos: parcela.desconto.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 2 }),
            valorOverride: parcela.valor,
            contribuicaoParcelaNumero: parcela.numero,
            emailOverride: emailOverrides[empresa.id],
            mensagemPersonalizada: descricao,
          });
          parcelasContribuicaoEmitidas += 1;
          setBatchEmissionProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        }
      } else {
        setBatchEmissionProgress({ done: 0, total: targetEmpresas.length });
        for (const empresa of targetEmpresas) {
          await createBoletoMutation.mutateAsync({ ...boletoForm, empresaId: empresa.id, empresaNome: empresa.nome, emailOverride: emailOverrides[empresa.id] });
          setBatchEmissionProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        }
      }
      toast({
        title: boletoForm.tipo === "contribuicao"
          ? "Boletos de Contribuição Assistencial emitidos com sucesso"
          : isBatchMode
            ? "Boletos em lote emitidos com sucesso"
            : "Boleto emitido com sucesso",
        description: boletoForm.tipo === "contribuicao"
          ? `${parcelasContribuicaoEmitidas} boleto(s) pendente(s) de ${contribuicaoLoteRows.length} empresa(s) foram criados.`
          : isBatchMode
            ? `${targetEmpresas.length} empresa(s) processada(s).`
            : `Boleto para ${boletoForm.empresaNome} criado.`,
      });
      resetWizard();
    } catch (err) {
      toast({
        title: "Falha ao emitir boleto",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsEmittingBoletos(false);
    }
  };

  const handleEmitirTrimestreAutomatico = async () => {
    if (!trimestreAutomaticoVencimento || !isValid(parseISO(trimestreAutomaticoVencimento))) {
      toast({ title: "Vencimento obrigatório", description: "Informe uma data de vencimento válida.", variant: "destructive" });
      return;
    }
    if (trimestreAutomaticoPendentes.length === 0) {
      toast({ title: "Nenhum boleto necessário", description: "Todas as competências elegíveis desse trimestre já foram emitidas." });
      return;
    }
    if (trimestreAutomaticoImpedidas.length > 0) {
      toast({
        title: "Cadastros incompletos",
        description: "Corrija os impedimentos mostrados na análise antes de gerar o lote.",
        variant: "destructive",
      });
      return;
    }

    let emitidos = 0;
    try {
      setTrimestreAutomaticoConfirmOpen(false);
      setIsEmittingBoletos(true);
      setBatchEmissionProgress({ done: 0, total: trimestreAutomaticoPendentes.length });

      for (const row of trimestreAutomaticoPendentes) {
        const primeiraCompetencia = row.competenciasPendentes[0];
        const ultimaCompetencia = row.competenciasPendentes[row.competenciasPendentes.length - 1];
        await createBoletoMutation.mutateAsync({
          ...boletoForm,
          tipo: "mensalidade",
          empresaId: row.empresaId,
          empresaNome: row.empresaNome,
          competenciaInicial: primeiraCompetencia,
          competenciaFinal: ultimaCompetencia,
          dataVencimento: trimestreAutomaticoVencimento,
          faixaId: row.faixaId,
          unificarCompetencias: "Sim",
          mensagemPersonalizada: `Mensalidade do ${trimestreAutomaticoNumero}º trimestre de ${trimestreAutomaticoAno}, referente à competência ${getCompetenciaRangeLabel(primeiraCompetencia, ultimaCompetencia)}.`,
          anoContribuicao: "",
          periodicidade: "Trimestral",
          parcelas: "1",
          baseCalculo: "",
          percentual: "",
          descontos: "",
          valorCalculado: row.valorTotal,
          valorOverride: row.valorTotal,
          descontoValorOverride: row.descontoMensal * row.competenciasPendentes.length,
        });
        emitidos += 1;
        setBatchEmissionProgress((prev) => ({ ...prev, done: emitidos }));
      }

      toast({
        title: "Trimestre processado com sucesso",
        description: `${emitidos} boleto(s) gerado(s). ${planoTrimestreAutomatico.length - trimestreAutomaticoPendentes.length} empresa(s) não precisavam de nova emissão.`,
      });
      setTrimestreAutomaticoOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
    } catch (err) {
      toast({
        title: emitidos > 0 ? "Lote emitido parcialmente" : "Falha ao emitir o lote trimestral",
        description: `${emitidos} de ${trimestreAutomaticoPendentes.length} boleto(s) foram gerados. ${err instanceof Error ? err.message : "Tente novamente em instantes."}`,
        variant: "destructive",
      });
      await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
    } finally {
      setIsEmittingBoletos(false);
    }
  };

  const extractChargeId = (id: string) => {
    const chargeIdFromQuery = data?.financeiro_boletos.find((item) => item.id === id)?.efi_charge_id;
    if (!chargeIdFromQuery) return null;
    const parsed = Number(chargeIdFromQuery);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return null;
  };

  const syncDueDateInHasura = async (id: string, vencimento: string) => {
    await hasuraRequest({
      token,
      query: UPDATE_BOLETO_VENCIMENTO_HASURA,
      variables: { id, vencimento },
    });
    queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
  };

  const syncStatusInHasura = async (id: string, efiStatus: "cancelado" | "inadimplente" | "emitido" | "pago") => {
    await hasuraRequest({
      token,
      query: UPDATE_BOLETO_STATUS_HASURA,
      variables: { id, efi_status: efiStatus },
    });
    queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
  };

  const syncDescricaoInHasura = async (id: string, descricao: string) => {
    await hasuraRequest({
      token,
      query: UPDATE_BOLETO_DESCRICAO_HASURA,
      variables: { id, descricao: descricao || null },
    });
    queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
  };

  const appendObservacaoEmpresa = async (empresaNome: string, comentario: string) => {
    const empresa = data?.empresas.find((item) => item.razao_social === empresaNome);
    if (!empresa || !comentario.trim()) return;
    const stamp = format(new Date(), "dd/MM/yyyy HH:mm");
    const historicoAtual = (empresa.observacoes ?? "").trim();
    const novoHistorico = [`[${stamp}] ${comentario.trim()}`, historicoAtual].filter(Boolean).join("\n---\n");
    await hasuraRequest({
      query: `
        mutation UpdateEmpresaObservacoes($id: uuid!, $observacoes: String) {
          update_empresas_by_pk(pk_columns: { id: $id }, _set: { observacoes: $observacoes }) { id }
        }
      `,
      variables: { id: empresa.id, observacoes: novoHistorico },
      token,
    });
    await queryClient.invalidateQueries({ queryKey: ["financeiro-page"] });
  };

  useEffect(() => {
    const syncOverdueStatuses = async () => {
      const overdue = boletos.filter((boleto) => {
        const normalized = normalizeBoletoStatus(boleto.status).toLowerCase();
        if (["pago", "cancelado", "inadimplente"].includes(normalized)) return false;
        const due = parseVencimento(boleto.vencimento);
        return !!(due && isBefore(due, new Date()));
      });
      if (overdue.length === 0) return;
      await Promise.all(overdue.map((boleto) => syncStatusInHasura(boleto.id, "inadimplente")));
    };
    void syncOverdueStatuses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletos]);

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
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setWizardOpen(true)}
                          className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar boleto
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => { setIsBatchMode(true); setWizardOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar boleto em lote
                        </Button>
                      </div>
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
                            <TableHead>Descrição</TableHead>
                            <TableHead>Comunicação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBoletos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                Nenhum boleto encontrado com os filtros aplicados.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedBoletos.map((boleto) => {
                              const empresa = mockEmpresas.find((e) => e.id === boleto.empresaId) ?? mockEmpresas.find((e) => e.razaoSocial === boleto.empresa);
                              const contato = empresa?.contatoPrincipal;
                              const formatWhatsappLink = (whatsapp?: string) => {
                                if (!whatsapp) return null;
                                const digits = whatsapp.replace(/\D/g, "");
                                return digits ? `https://wa.me/${digits}` : null;
                              };
                              const whatsappLink = formatWhatsappLink(contato?.whatsapp);
                              const effectiveStatus = getBoletoEffectiveStatus(boleto);
                              const isSendingCurrentBoletoCommunication = sendingBoletoCommunication?.startsWith(`${boleto.id}:`);

                              return (
                                <TableRow key={boleto.id}>
                                  <TableCell className="font-medium">
                                    <div className="space-y-0.5">
                                      <p>{boleto.empresa}</p>
                                      {boleto.empresaFantasia && boleto.empresaFantasia !== boleto.empresa && (
                                        <p className="text-xs font-normal text-muted-foreground">{boleto.empresaFantasia}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">{boleto.tipo}</span>
                                  </TableCell>
                                  <TableCell>
                                    R$ {boleto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell>{formatDueDateBR(boleto.vencimento)}</TableCell>
                                  <TableCell>{getStatusBadge(effectiveStatus)}</TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground line-clamp-2">
                                      {(boleto as BoletoView & { descricao?: string }).descricao || "Sem descrição"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        {whatsappLink ? (
                                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`Abrir WhatsApp de ${contato?.nome || boleto.empresa}`}>
                                              <MessageCircle className="h-4 w-4 text-green-600" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        )}
                                        {contato?.email ? (
                                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                            <a href={`mailto:${contato.email}`} aria-label={`Enviar e-mail para ${contato?.nome || boleto.empresa}`}>
                                              <Mail className="h-4 w-4 text-blue-600" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {boleto.enviadoWhatsappEm && (
                                          <Badge variant="outline" className="border-green-200 bg-green-50 text-[11px] text-green-700">
                                            WhatsApp enviado
                                          </Badge>
                                        )}
                                        {boleto.enviadoEmailEm && (
                                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[11px] text-blue-700">
                                            E-mail enviado
                                          </Badge>
                                        )}
                                        {isSendingCurrentBoletoCommunication && (
                                          <span className="text-xs text-muted-foreground">Enviando...</span>
                                        )}
                                        {!isSendingCurrentBoletoCommunication && !boleto.enviadoWhatsappEm && !boleto.enviadoEmailEm && (
                                          <span className="text-xs text-muted-foreground">Não enviado</span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <BoletoActionsCell
                                      status={effectiveStatus}
                                      whatsappLink={whatsappLink}
                                      onDetails={() => navigate(`/dashboard/financeiro/${boleto.id}`)}
                                      onDownload={() => handleDownloadBoleto(boleto)}
                                      onWhatsApp={
                                        !isSendingCurrentBoletoCommunication
                                          ? () => handleSendBoletoWhatsapp(boleto, contato?.whatsapp)
                                          : undefined
                                      }
                                      onEmail={
                                        !isSendingCurrentBoletoCommunication
                                          ? () => handleSendBoletoEmail(boleto, contato?.email)
                                          : undefined
                                      }
                                      onReplicate={
                                        effectiveStatus === "Inadimplente"
                                          ? () => startBoletoReplication(boleto)
                                          : undefined
                                      }
                                      onGenerateNew={() => {
                                        if (regeneratedFromCancel.includes(boleto.id)) {
                                          toast({ title: "Boleto já regenerado", description: "Este boleto cancelado já foi utilizado para gerar um novo boleto." });
                                          return;
                                        }
                                        setSelectedBoletoForNew({
                                          id: boleto.id,
                                          empresa: boleto.empresa,
                                          vencimento: boleto.vencimento,
                                          valor: boleto.valor,
                                        });
                                        setGerarNovoOpen(true);
                                      }}
                                      onChangeDueDate={async () => {
                                        setSelectedBoletoForDueDate(boleto);
                                        setNewDueDate(boleto.vencimento);
                                        setDueDateDialogOpen(true);
                                      }}
                                      onDescription={() => {
                                        setSelectedBoletoForDescription(boleto as BoletoView);
                                        setDescriptionDraft((boleto as BoletoView & { descricao?: string }).descricao ?? "");
                                        setDescriptionDialogOpen(true);
                                      }}
                                      onCommunication={() => {
                                        setSelectedEmpresaComunicacao(boleto.empresa);
                                        setNovaNotaComunicacao("");
                                        setComunicacaoDialogOpen(true);
                                      }}
                                      onEditCompany={() => {
                                        const empresaRow = data?.empresas.find((e) => e.id === boleto.empresaId) ?? data?.empresas.find((e) => e.razao_social === boleto.empresa);
                                        if (!empresaRow) return;
                                        navigate(`/dashboard/empresas?editar=${empresaRow.id}`);
                                      }}
                                      onCancel={() => {
                                        setSelectedBoletoForCancel(boleto as BoletoView);
                                        setCancelReason("");
                                        setCancelAndRegenerate(false);
                                        setCancelDialogOpen(true);
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        page={boletosPage}
                        pageSize={boletosPageSize}
                        total={filteredBoletos.length}
                        onPageChange={setBoletosPage}
                        onPageSizeChange={(size) => {
                          setBoletosPageSize(size);
                          setBoletosPage(1);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Modal for Gerar Novo Boleto */}
                <GerarNovoBoletoModal
                  open={gerarNovoOpen}
                  onOpenChange={setGerarNovoOpen}
                  boleto={selectedBoletoForNew}
                  onGenerate={async (boletoId, novaData, novoValor) => {
                    const original = boletos.find((b) => b.id === boletoId);
                    if (original) {
                      const empresaMatch = data?.empresas.find(
                        (empresa) => empresa.id === original.empresaId || empresa.razao_social === original.empresa,
                      );
                      const tipoOriginal = original.tipo === "Contribuição Assistencial"
                        ? "contribuicao"
                        : original.tipo === "Boleto avulso" || original.tipo === "Avulso"
                          ? "avulso"
                          : "mensalidade";
                      const payload: BoletoForm = {
                        tipo: tipoOriginal,
                        empresaId: empresaMatch?.id ?? original.empresaId ?? "",
                        empresaNome: original.empresa,
                        competenciaInicial: original.competenciaInicial ?? "",
                        competenciaFinal: original.competenciaFinal ?? "",
                        dataVencimento: format(novaData, "yyyy-MM-dd"),
                        faixaId: original.faixaId ?? "",
                        unificarCompetencias: "Não",
                        mensagemPersonalizada: original.descricao ?? "",
                        anoContribuicao: original.ano ?? "",
                        periodicidade: original.periodicidade ?? "",
                        parcelas: original.parcelas ? String(original.parcelas) : "",
                        baseCalculo: original.base ? String(original.base) : "",
                        percentual: original.percentual ? String(original.percentual) : "",
                        descontos: original.descontos ? String(original.descontos) : "",
                        valorCalculado: original.valor,
                        valorOverride: novoValor,
                        pesquisaContribuicaoFeita: true,
                        valorAvulso: novoValor ? String(novoValor) : String(original.valor),
                        motivoCobranca: original.descricao ?? "",
                      };

                      try {
                        const isReplication = selectedBoletoForReplication?.id === original.id;
                        await createBoletoMutation.mutateAsync(payload);
                        if (isReplication && replicateCancelAfter) {
                          await cancelReplicatedOriginalBoleto(original);
                        }
                        toast({
                          title: isReplication ? "Boleto replicado" : "Novo boleto gerado",
                          description: isReplication && replicateCancelAfter
                            ? `Novo boleto para ${original.empresa} gerado e original cancelado.`
                            : `Novo boleto para ${original.empresa} gerado.`,
                        });
                      } catch (err) {
                        toast({
                          title: "Falha ao replicar boleto",
                          description: err instanceof Error ? err.message : "Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }
                    setSelectedBoletoForNew(null);
                    setSelectedBoletoForReplication(null);
                    setReplicateCancelAfter(false);
                  }}
                />

                <AlertDialog open={replicateDialogOpen} onOpenChange={setReplicateDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Replicar boleto inadimplente</AlertDialogTitle>
                      <AlertDialogDescription>
                        O novo boleto será criado copiando empresa, tipo, competência, descrição e valor do boleto original.
                        Depois você poderá ajustar vencimento e valor antes de confirmar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 py-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={replicateCancelAfter}
                          onChange={(event) => setReplicateCancelAfter(event.target.checked)}
                        />
                        Cancelar o boleto original após replicar
                      </label>
                      {replicateCancelAfter && (
                        <div className="space-y-2">
                          <Label htmlFor="replicate-cancel-reason">Motivo do cancelamento</Label>
                          <Input
                            id="replicate-cancel-reason"
                            value={replicateCancelReason}
                            onChange={(event) => setReplicateCancelReason(event.target.value)}
                            placeholder="Informe o motivo que ficará registrado no boleto cancelado"
                          />
                        </div>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(event) => {
                          if (replicateCancelAfter && !replicateCancelReason.trim()) {
                            event.preventDefault();
                            toast({ title: "Motivo obrigatório", description: "Informe o motivo para cancelar o boleto original.", variant: "destructive" });
                            return;
                          }
                          continueBoletoReplication();
                        }}
                        className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                      >
                        Continuar replicação
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Alterar vencimento do boleto</DialogTitle>
                      <DialogDescription>
                        Ajuste a data de vencimento para {selectedBoletoForDueDate?.empresa}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label>Nova data de vencimento</Label>
                      <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDueDateDialogOpen(false)} disabled={isUpdatingDueDate}>Cancelar</Button>
                      <Button
                        disabled={isUpdatingDueDate}
                        onClick={async () => {
                          if (!selectedBoletoForDueDate || !newDueDate) return;
                          const chargeId = extractChargeId(selectedBoletoForDueDate.id);
                          if (!chargeId) {
                            toast({
                              title: "Boleto sem charge_id",
                              description: "Não foi possível identificar charge_id para alterar vencimento.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            setIsUpdatingDueDate(true);
                            await updateBoletoDueDateRequest(chargeId, newDueDate);
                            await syncDueDateInHasura(selectedBoletoForDueDate.id, newDueDate);
                            toast({ title: "Vencimento atualizado", description: `Novo vencimento: ${newDueDate}.` });
                            setDueDateDialogOpen(false);
                          } catch (err) {
                            toast({
                              title: "Falha ao alterar vencimento",
                              description: err instanceof Error ? err.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsUpdatingDueDate(false);
                          }
                        }}
                      >
                        {isUpdatingDueDate ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Descrição do boleto</DialogTitle>
                      <DialogDescription>
                        {selectedBoletoForDescription?.empresa ? `Observações para ${selectedBoletoForDescription.empresa}` : "Edite as observações do boleto."}
                      </DialogDescription>
                    </DialogHeader>
                    <textarea
                      className="w-full min-h-28 rounded-md border bg-background p-3 text-sm"
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      placeholder="Escreva observações sobre este boleto..."
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDescriptionDialogOpen(false)} disabled={isSavingDescription}>Cancelar</Button>
                      <Button
                        disabled={isSavingDescription}
                        onClick={async () => {
                          if (!selectedBoletoForDescription) return;
                          try {
                            setIsSavingDescription(true);
                            await syncDescricaoInHasura(selectedBoletoForDescription.id, descriptionDraft);
                            await appendObservacaoEmpresa(
                              selectedBoletoForDescription.empresa,
                              `Boleto (${selectedBoletoForDescription.id}): ${descriptionDraft}`,
                            );
                            toast({ title: "Descrição atualizada" });
                            setDescriptionDialogOpen(false);
                          } finally {
                            setIsSavingDescription(false);
                          }
                        }}
                      >
                        {isSavingDescription ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancelar boleto</DialogTitle>
                      <DialogDescription>Informe o motivo do cancelamento (obrigatório).</DialogDescription>
                    </DialogHeader>
                    <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motivo do cancelamento" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={cancelAndRegenerate} onChange={(e) => setCancelAndRegenerate(e.target.checked)} />
                      Gerar novo boleto após cancelar
                    </label>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isCancellingBoleto}>Voltar</Button>
                      <Button
                        disabled={isCancellingBoleto}
                        onClick={async () => {
                          if (!selectedBoletoForCancel) return;
                          if (!cancelReason.trim()) {
                            toast({ title: "Motivo obrigatório", variant: "destructive" });
                            return;
                          }
                          const chargeId = selectedBoletoForCancel.efiChargeId ? Number(selectedBoletoForCancel.efiChargeId) : extractChargeId(selectedBoletoForCancel.id);
                          if (!chargeId) return;
                          try {
                            setIsCancellingBoleto(true);
                            await cancelBoletoRequest(chargeId);
                            await syncStatusInHasura(selectedBoletoForCancel.id, "cancelado");
                            await syncDescricaoInHasura(selectedBoletoForCancel.id, `Cancelado: ${cancelReason}`);
                            await appendObservacaoEmpresa(
                              selectedBoletoForCancel.empresa,
                              `Cancelamento de boleto (${selectedBoletoForCancel.id}): ${cancelReason}`,
                            );
                            if (cancelAndRegenerate) {
                              setSelectedBoletoForNew({ id: selectedBoletoForCancel.id, empresa: selectedBoletoForCancel.empresa, vencimento: selectedBoletoForCancel.vencimento, valor: selectedBoletoForCancel.valor });
                              setRegeneratedFromCancel((prev) => [...prev, selectedBoletoForCancel.id]);
                              setGerarNovoOpen(true);
                            }
                            setCancelDialogOpen(false);
                          } finally {
                            setIsCancellingBoleto(false);
                          }
                        }}
                      >
                        {isCancellingBoleto ? "Cancelando..." : "Confirmar cancelamento"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                      <Button className="bg-[#00A86B] hover:bg-[#00A86B]/90" onClick={() => {
                        const anoAtual = String(new Date().getFullYear());
                        setBoletoForm((prev) => ({ ...prev, tipo: "contribuicao", anoContribuicao: anoAtual, percentual: prev.percentual || "2", periodicidade: "Anual", parcelas: "2" }));
                        setContribuicaoLoteRows(buildContribuicaoRowsFromPreviousYear(anoAtual));
                        setWizardStep(2);
                        setWizardOpen(true);
                      }}>
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
                    <CardTitle className="text-lg">Emissão em lote disponível no wizard</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Carregue os contribuintes do ano anterior, informe ou repita a folha de agosto e revise os valores antes de gerar os boletos.
                      A fórmula aplicada é: Folha de agosto × Percentual / 100.
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
                            <TableHead>Label</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {faixas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nenhuma faixa cadastrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            faixas.map((faixa) => (
                              <TableRow key={faixa.id}>
                                <TableCell>{faixa.descricao || "—"}</TableCell>
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
                    Defina a descrição da faixa e o valor correspondente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="faixaDescricao">Descrição*</Label>
                    <Input
                      id="faixaDescricao"
                      placeholder="Ex: Faixa Comércio Varejista"
                      value={faixaForm.descricao}
                      onChange={(e) => setFaixaForm({ ...faixaForm, descricao: e.target.value })}
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

            <Dialog
              open={trimestreAutomaticoOpen}
              onOpenChange={(open) => {
                if (!isEmittingBoletos) setTrimestreAutomaticoOpen(open);
              }}
            >
              <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gerar mensalidades do trimestre automaticamente</DialogTitle>
                  <DialogDescription>
                    O sistema analisa todas as faixas, identifica as competências já emitidas e gera somente o período restante de cada nova associada.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="trimestreAutomaticoAno">Ano de referência</Label>
                    <Input
                      id="trimestreAutomaticoAno"
                      type="number"
                      min="2000"
                      max="2100"
                      value={trimestreAutomaticoAno}
                      onChange={(event) => setTrimestreAutomaticoAno(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trimestre de referência</Label>
                    <Select
                      value={String(trimestreAutomaticoNumero)}
                      onValueChange={(value) => setTrimestreAutomaticoNumero(Number(value) as TrimestreNumero)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º trimestre — janeiro a março</SelectItem>
                        <SelectItem value="2">2º trimestre — abril a junho</SelectItem>
                        <SelectItem value="3">3º trimestre — julho a setembro</SelectItem>
                        <SelectItem value="4">4º trimestre — outubro a dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento dos novos boletos</Label>
                    <DatePickerField
                      value={trimestreAutomaticoVencimento}
                      placeholder="Informe o vencimento"
                      onChange={setTrimestreAutomaticoVencimento}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  São analisadas as entradas entre o mês anterior ao trimestre e o último mês do trimestre. Entradas do dia 28 em diante passam a valer no mês seguinte. Boletos pagos, aguardando ou inadimplentes contam como já emitidos; cancelados não contam.
                </div>

                {empresasAssociadasSemData.length > 0 && (
                  <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Há associadas sem data de associação</p>
                      <p className="text-sm">
                        {empresasAssociadasSemData.length} empresa(s) não podem entrar na análise automática até que a data de associação seja cadastrada.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-4">
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Analisadas</p><p className="text-2xl font-bold">{planoTrimestreAutomatico.length}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Com boleto a gerar</p><p className="text-2xl font-bold">{trimestreAutomaticoPendentes.length}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sem nova emissão</p><p className="text-2xl font-bold">{planoTrimestreAutomatico.length - trimestreAutomaticoPendentes.length}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor do lote</p><p className="text-xl font-bold text-primary">{formatCurrencyBRL(trimestreAutomaticoValorTotal)}</p></CardContent></Card>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Já emitido</TableHead>
                        <TableHead>Será gerado</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planoTrimestreAutomatico.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            Nenhuma associada encontrada na janela de quatro meses desse trimestre.
                          </TableCell>
                        </TableRow>
                      ) : planoTrimestreAutomatico.map((row) => (
                        <TableRow key={row.empresaId}>
                          <TableCell className="font-medium">{row.empresaNome}</TableCell>
                          <TableCell>{formatDateBR(row.dataAssociacao)}</TableCell>
                          <TableCell>{row.competenciasEmitidas.length > 0 ? row.competenciasEmitidas.map(formatCompetenciaBR).join(", ") : "Nenhuma"}</TableCell>
                          <TableCell>{row.competenciasPendentes.length > 0 ? getCompetenciaRangeLabel(row.competenciasPendentes[0], row.competenciasPendentes[row.competenciasPendentes.length - 1]) : "—"}</TableCell>
                          <TableCell>{formatCurrencyBRL(row.valorTotal)}</TableCell>
                          <TableCell>
                            {row.impedimentos.length > 0 ? (
                              <Badge variant="destructive">{row.impedimentos.join(", ")}</Badge>
                            ) : row.competenciasPendentes.length > 0 ? (
                              <Badge className="bg-blue-100 text-blue-800">Pronto para gerar</Badge>
                            ) : (
                              <Badge variant="secondary">Nenhuma emissão</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {isEmittingBoletos && batchEmissionProgress.total > 0 && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between"><span>Emitindo boletos...</span><span>{batchEmissionProgress.done}/{batchEmissionProgress.total}</span></div>
                    <Progress value={(batchEmissionProgress.done / batchEmissionProgress.total) * 100} />
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setTrimestreAutomaticoOpen(false)} disabled={isEmittingBoletos}>Cancelar</Button>
                  <Button
                    className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                    disabled={isEmittingBoletos || !trimestreAutomaticoVencimento || trimestreAutomaticoPendentes.length === 0 || trimestreAutomaticoImpedidas.length > 0}
                    onClick={() => setTrimestreAutomaticoConfirmOpen(true)}
                  >
                    Gerar boletos do trimestre
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={trimestreAutomaticoConfirmOpen} onOpenChange={setTrimestreAutomaticoConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar emissão automática?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Serão gerados {trimestreAutomaticoPendentes.length} boleto(s), no total de {formatCurrencyBRL(trimestreAutomaticoValorTotal)}, com vencimento em {formatDateBR(trimestreAutomaticoVencimento)}. Competências já emitidas não serão cobradas novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#00A86B] hover:bg-[#00A86B]/90"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleEmitirTrimestreAutomatico();
                    }}
                  >
                    Confirmar e gerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Wizard de Criação de Boletos */}
            <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
              <DialogContent className={cn("max-h-[90vh] overflow-y-auto", boletoForm.tipo === "contribuicao" ? "max-w-6xl" : "max-w-3xl")}>
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
                          const tipoSelecionado = value as "mensalidade" | "contribuicao" | "avulso";
                          const anoAtual = String(new Date().getFullYear());
                          if (tipoSelecionado === "contribuicao") {
                            setIsBatchMode(false);
                            setBatchEmpresaIds([]);
                            setContribuicaoLoteRows(buildContribuicaoRowsFromPreviousYear(anoAtual));
                          }
                          setBoletoForm({
                            ...boletoForm,
                            tipo: tipoSelecionado,
                            anoContribuicao: tipoSelecionado === "contribuicao" ? anoAtual : boletoForm.anoContribuicao,
                            periodicidade: tipoSelecionado === "contribuicao" ? "Mensal" : boletoForm.periodicidade,
                            parcelas: tipoSelecionado === "contribuicao" ? "2" : boletoForm.parcelas,
                            percentual: tipoSelecionado === "contribuicao" ? boletoForm.percentual || "2" : boletoForm.percentual,
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
                            Mensalidade de vínculo
                            <span className="block text-xs text-muted-foreground mt-1">
                              Associados por faixa; mantenedores e parceiros pelo valor mensal cadastrado.
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value="avulso" id="avulso" />
                          <Label htmlFor="avulso" className="cursor-pointer flex-1">
                            Boleto avulso
                            <span className="block text-xs text-muted-foreground mt-1">
                              Crie uma cobrança sem faixa, com valor personalizado e motivo na descrição.
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value="contribuicao" id="contribuicao" />
                          <Label htmlFor="contribuicao" className="flex-1 cursor-pointer">
                            Contribuição Assistencial
                            <span className="block text-xs text-muted-foreground mt-1">
                              Use a folha de agosto e escolha entre boleto único ou duas parcelas.
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {boletoForm.tipo !== "contribuicao" && <div className="space-y-3">
                      <Label htmlFor="empresaSearch" className="text-base font-semibold">Empresa*</Label>
                      {isBatchMode && <p className="text-xs text-muted-foreground">Modo lote ativo: selecione várias empresas (salvo no navegador).</p>}
                      {isBatchMode && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="flex flex-col gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">Mensalidades trimestrais automáticas</p>
                              <p className="text-xs text-muted-foreground">Analisa todas as faixas e gera somente as competências que ainda faltam.</p>
                            </div>
                            <Button
                              type="button"
                              className="shrink-0 bg-[#00A86B] hover:bg-[#00A86B]/90"
                              onClick={() => {
                                const agora = new Date();
                                setTrimestreAutomaticoAno(String(agora.getFullYear()));
                                setTrimestreAutomaticoNumero((Math.floor(agora.getMonth() / 3) + 1) as TrimestreNumero);
                                setTrimestreAutomaticoVencimento("");
                                setWizardOpen(false);
                                setIsBatchMode(false);
                                setTrimestreAutomaticoOpen(true);
                              }}
                            >
                              <Calculator className="h-4 w-4 mr-2" />
                              Gerar boletos do trimestre automático
                            </Button>
                          </div>
                          <Label>Tipo de vínculo para o lote</Label>
                          <Select
                            value={batchTipoVinculo}
                            onValueChange={(value: "Associado" | "Mantenedor" | "Parceiro" | "Fornecedor") => {
                              setBatchTipoVinculo(value);
                              setBatchFaixaId("");
                              setBatchEmpresaIds([]);
                              setBoletoForm((prev) => ({ ...prev, faixaId: "" }));
                            }}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Associado">Associados — trimestral por faixa</SelectItem>
                              <SelectItem value="Mantenedor">Mantenedores — mensal por valor cadastrado</SelectItem>
                              <SelectItem value="Parceiro">Parceiros — mensal por valor cadastrado</SelectItem>
                              <SelectItem value="Fornecedor">Fornecedores — sem mensalidade automática</SelectItem>
                            </SelectContent>
                          </Select>
                          {batchTipoVinculo === "Fornecedor" && (
                            <p className="text-sm text-amber-700">Fornecedores não possuem mensalidade automática. Use boleto avulso quando necessário.</p>
                          )}
                          {batchTipoVinculo === "Associado" && <>
                          <Label>Selecionar faixa para lote</Label>
                          <Select value={batchFaixaId} onValueChange={(value) => { setBatchFaixaId(value); setBatchEmpresaIds([]); setBoletoForm((prev) => ({ ...prev, faixaId: value })); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha uma faixa" />
                            </SelectTrigger>
                            <SelectContent>
                              {faixas.map((faixa) => (
                                <SelectItem key={faixa.id} value={faixa.id}>
                                  {faixa.min}–{faixa.max} ({faixa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          </>}
                          {batchTipoVinculo !== "Associado" && batchTipoVinculo !== "Fornecedor" && (
                            <div className="space-y-2 max-h-48 overflow-auto">
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setBatchEmpresaIds(empresasDoVinculoSelecionado.filter((empresa) => empresa.valorMensalidadeVinculo > 0).map((empresa) => empresa.id))}>Selecionar todas com valor</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setBatchEmpresaIds([])}>Deselecionar tudo</Button>
                              </div>
                              {empresasDoVinculoSelecionado.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada para este vínculo.</p>}
                              {empresasDoVinculoSelecionado.map((empresa) => (
                                <label key={empresa.id} className="flex items-center justify-between gap-3 text-sm">
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      disabled={empresa.valorMensalidadeVinculo <= 0}
                                      checked={batchEmpresaIds.includes(empresa.id)}
                                      onChange={(event) => setBatchEmpresaIds((prev) => event.target.checked ? Array.from(new Set([...prev, empresa.id])) : prev.filter((id) => id !== empresa.id))}
                                    />
                                    {empresa.nome}{empresa.categoriaMantenedor ? ` • ${empresa.categoriaMantenedor}` : ""}
                                  </span>
                                  <span className={empresa.valorMensalidadeVinculo > 0 ? "font-medium" : "text-destructive"}>
                                    {empresa.valorMensalidadeVinculo > 0 ? `R$ ${empresa.valorMensalidadeVinculo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Valor não cadastrado"}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                          {batchFaixaId && (
                            <div className="space-y-2 max-h-48 overflow-auto">
                              {!isLoadingEmpresasPorFaixa && empresasDaFaixaSelecionada.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBatchEmpresaIds(empresasDaFaixaSelecionada.map((empresa) => empresa.id))}
                                  >
                                    Selecionar todas
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBatchEmpresaIds([])}
                                  >
                                    Deselecionar tudo
                                  </Button>
                                </div>
                              )}
                              {isLoadingEmpresasPorFaixa && (
                                <p className="text-sm text-muted-foreground">Carregando empresas da faixa...</p>
                              )}
                              {!isLoadingEmpresasPorFaixa && empresasDaFaixaSelecionada.length === 0 && (
                                <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada para a faixa selecionada.</p>
                              )}
                              {!isLoadingEmpresasPorFaixa && empresasDaFaixaSelecionada.map((empresa) => (
                                <label key={empresa.id} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={batchEmpresaIds.includes(empresa.id)}
                                    onChange={(e) => setBatchEmpresaIds((prev) => e.target.checked ? Array.from(new Set([...prev, empresa.id])) : prev.filter((id) => id !== empresa.id))}
                                  />
                                  {empresa.nome} ({empresa.qtdFuncionarios} func.)
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
                                onClick={() => {
                                  if (isBatchMode) {
                                    if (empresa.tipoVinculo !== batchTipoVinculo || (batchTipoVinculo === "Associado" && batchFaixaId && empresa.faixaId !== batchFaixaId)) {
                                      toast({ title: "Empresa fora da faixa", description: "Selecione apenas empresas da faixa escolhida para o lote.", variant: "destructive" });
                                      return;
                                    }
                                    setBatchEmpresaIds((prev) => (prev.includes(empresa.id) ? prev : [...prev, empresa.id]));
                                    setEmpresaSearch("");
                                    return;
                                  }
                                  handleSelectEmpresa(empresa);
                                }}
                              >
                                <div className="font-medium">{empresa.nome}</div>
                                <div className="text-sm text-muted-foreground">{empresa.cnpj} • {empresa.qtdFuncionarios} funcionário(s)</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isBatchMode && boletoForm.empresaNome && (
                        <div className="text-sm text-muted-foreground">
                          ✓ Empresa selecionada: {boletoForm.empresaNome}
                        </div>
                      )}
                      {isBatchMode && (
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div>{batchEmpresaIds.length} empresa(s) selecionada(s).</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setBatchEmpresaIds([])}>Deselecionar tudo</Button>
                        </div>
                      )}
                    </div>}
                  </div>
                )}

                {/* Etapa 2: Detalhes por tipo */}
                {wizardStep === 2 && boletoForm.tipo === "mensalidade" && (
                  <div className="space-y-6">
                    {!isBatchMode && boletoForm.empresaId && mockEmpresas.find((empresa) => empresa.id === boletoForm.empresaId)?.tipoVinculo === "Associado" && !boletoForm.faixaId && (
                      <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-semibold">Empresa sem faixa cadastrada</p>
                          <p className="text-sm">Selecione uma faixa abaixo para esta emissão ou atualize o cadastro completo da empresa.</p>
                        </div>
                      </div>
                    )}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalhes da mensalidade</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Competência Inicial*</Label>
                            <MonthPickerField
                              value={boletoForm.competenciaInicial}
                              placeholder="Selecione a competência inicial"
                              onChange={(value) => setBoletoForm((prev) => ({
                                ...prev,
                                competenciaInicial: value,
                                competenciaFinal: prev.competenciaFinal || value,
                                mensagemPersonalizada: prev.mensagemPersonalizada || `Boleto referente à competência ${getCompetenciaRangeLabel(value, prev.competenciaFinal || value)}`,
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Competência Final*</Label>
                            <MonthPickerField
                              value={boletoForm.competenciaFinal}
                              placeholder="Selecione a competência final"
                              onChange={(value) => setBoletoForm((prev) => ({
                                ...prev,
                                competenciaFinal: value,
                                mensagemPersonalizada: prev.mensagemPersonalizada || `Boleto referente à competência ${getCompetenciaRangeLabel(prev.competenciaInicial, value)}`,
                              }))}
                            />
                          </div>
                        </div>

                        {((!isBatchMode && mockEmpresas.find((empresa) => empresa.id === boletoForm.empresaId)?.tipoVinculo !== "Associado") || (isBatchMode && batchTipoVinculo !== "Associado")) && (
                          <div className="space-y-2">
                            <Label>Valor mensal</Label>
                            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                              {isBatchMode
                                ? "Cada empresa usará o valor mensal negociado em seu cadastro."
                                : `R$ ${(mockEmpresas.find((empresa) => empresa.id === boletoForm.empresaId)?.valorMensalidadeVinculo ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data Vencimento*</Label>
                            <DatePickerField
                              value={boletoForm.dataVencimento}
                              placeholder="Selecione o vencimento"
                              onChange={(value) => setBoletoForm({ ...boletoForm, dataVencimento: value })}
                            />
                          </div>
                          {((!isBatchMode && mockEmpresas.find((empresa) => empresa.id === boletoForm.empresaId)?.tipoVinculo === "Associado") || (isBatchMode && batchTipoVinculo === "Associado")) && <div className="space-y-2">
                            <Label htmlFor="faixa">Faixa*</Label>
                            <Select
                              value={boletoForm.faixaId}
                              onValueChange={(value) => setBoletoForm({ ...boletoForm, faixaId: value })}
                              disabled={isBatchMode && !!batchFaixaId}
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
                          </div>}
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
                            placeholder="Boleto referente à competência X a Y"
                            value={boletoForm.mensagemPersonalizada}
                            onChange={(e) => setBoletoForm({ ...boletoForm, mensagemPersonalizada: e.target.value })}
                          />
                        </div>

                        {(() => {
                          const preview = getMensalidadePreview();
                          return (
                            <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
                              <p className="text-sm font-medium">Resumo do valor:</p>
                              <p className="text-2xl font-bold text-primary">
                                R$ {preview.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                              <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                                <span>{preview.meses || 0} competência(s)</span>
                                <span>R$ {preview.valorMensalComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</span>
                                <span>{boletoForm.unificarCompetencias === "Sim" ? "1 boleto unificado" : `${preview.meses || 0} boleto(s)`}</span>
                              </div>
                              {!isBatchMode && preview.descontoPercentual > 0 && (
                                <p className="mt-2 text-xs text-[#7E8C5E]">
                                  Desconto de {preview.descontoPercentual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% aplicado:
                                  {" "}R$ {preview.descontoValorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês sobre R$ {preview.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
                                </p>
                              )}
                              {isBatchMode && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Em lote, descontos individuais cadastrados em cada empresa serão aplicados no momento da emissão.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {wizardStep === 2 && boletoForm.tipo === "contribuicao" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contribuição Assistencial em lote</CardTitle>
                        <p className="text-sm text-muted-foreground">Preencha a folha de agosto de cada empresa. O cálculo e a divisão dos boletos são feitos automaticamente.</p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="anoContribuicao">Ano da contribuição*</Label>
                            <Input
                              id="anoContribuicao"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="2026"
                              value={boletoForm.anoContribuicao}
                              onChange={(event) => {
                                const ano = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                setBoletoForm({ ...boletoForm, anoContribuicao: ano });
                                if (ano.length === 4) setContribuicaoLoteRows(buildContribuicaoRowsFromPreviousYear(ano));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="percentualContribuicao">Percentual sobre a folha (%)*</Label>
                            <Input
                              id="percentualContribuicao"
                              inputMode="decimal"
                              placeholder="2"
                              value={boletoForm.percentual}
                              onChange={(event) => setBoletoForm({ ...boletoForm, percentual: event.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Vencimento do boleto / 1ª parcela*</Label>
                            <DatePickerField value={boletoForm.vencimentoParcela1} placeholder="Selecione o vencimento" onChange={(value) => setBoletoForm({ ...boletoForm, vencimentoParcela1: value })} />
                          </div>
                          {contribuicaoLoteRows.some((row) => row.quantidadeParcelas === 2) && <div className="space-y-2">
                            <Label>Vencimento da 2ª parcela*</Label>
                            <DatePickerField value={boletoForm.vencimentoParcela2} placeholder="Selecione o segundo vencimento" onChange={(value) => setBoletoForm({ ...boletoForm, vencimentoParcela2: value })} />
                          </div>}
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold">Empresas contribuintes de {Number(boletoForm.anoContribuicao || new Date().getFullYear()) - 1}</p>
                              <p className="text-xs text-muted-foreground">“Folha anterior” é a base registrada no ano passado. Marque repetir quando a empresa não enviar a folha atual.</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setContribuicaoLoteRows(buildContribuicaoRowsFromPreviousYear(boletoForm.anoContribuicao))}>Recarregar ano anterior</Button>
                          </div>
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-44">Nome</TableHead>
                                  <TableHead className="min-w-32">Folha anterior</TableHead>
                                  <TableHead className="min-w-36">Folha de agosto</TableHead>
                                  <TableHead className="min-w-28">Repetir valor</TableHead>
                                  <TableHead className="min-w-32">Cálculo</TableHead>
                                  <TableHead className="min-w-28">Boletos</TableHead>
                                  <TableHead className="w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {contribuicaoLoteRows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma empresa encontrada no ano anterior. Adicione uma empresa abaixo.</TableCell></TableRow> : contribuicaoLoteRows.map((row) => {
                                  const folhaAtual = parseCurrencyInput(row.folhaAtual);
                                  const percentual = Number(boletoForm.percentual.replace(",", ".")) || 0;
                                  return <TableRow key={row.empresaId}>
                                    <TableCell className="font-medium">{row.empresaNome}</TableCell>
                                    <TableCell>{row.folhaAnoAnterior > 0 ? formatCurrencyBRL(row.folhaAnoAnterior) : "—"}</TableCell>
                                    <TableCell><Input inputMode="decimal" placeholder="0,00" value={row.folhaAtual} disabled={row.repetiuFolhaAnterior} onChange={(event) => updateContribuicaoLoteRow(row.empresaId, { folhaAtual: event.target.value, repetiuFolhaAnterior: false })} /></TableCell>
                                    <TableCell><label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={row.folhaAnoAnterior <= 0} checked={row.repetiuFolhaAnterior} onChange={(event) => updateContribuicaoLoteRow(row.empresaId, { repetiuFolhaAnterior: event.target.checked, folhaAtual: event.target.checked ? row.folhaAnoAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "" })} />Ano anterior</label></TableCell>
                                    <TableCell className="font-semibold text-primary">{folhaAtual > 0 ? formatCurrencyBRL((folhaAtual * percentual) / 100) : "—"}</TableCell>
                                    <TableCell><Select value={String(row.quantidadeParcelas)} onValueChange={(value) => updateContribuicaoLoteRow(row.empresaId, { quantidadeParcelas: Number(value) as 1 | 2 })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Único</SelectItem><SelectItem value="2">2 parcelas</SelectItem></SelectContent></Select></TableCell>
                                    <TableCell><Button type="button" variant="ghost" size="sm" aria-label={`Remover ${row.empresaNome}`} onClick={() => setContribuicaoLoteRows((rows) => rows.filter((item) => item.empresaId !== row.empresaId))}>×</Button></TableCell>
                                  </TableRow>;
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-2"><Label>Adicionar empresa da lista</Label><Select value={empresaContribuicaoParaAdicionar} onValueChange={setEmpresaContribuicaoParaAdicionar}><SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger><SelectContent>{mockEmpresas.filter((empresa) => !contribuicaoLoteRows.some((row) => row.empresaId === empresa.id)).map((empresa) => <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>)}</SelectContent></Select></div>
                            <Button type="button" variant="outline" disabled={!empresaContribuicaoParaAdicionar} onClick={addEmpresaAoLoteContribuicao}>Adicionar</Button>
                            <Button type="button" variant="outline" onClick={() => { setWizardOpen(false); navigate("/dashboard/empresas"); }}>Novo cadastro</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {wizardStep === 2 && boletoForm.tipo === "avulso" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalhes do Boleto Avulso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data Vencimento*</Label>
                            <DatePickerField
                              value={boletoForm.dataVencimento}
                              placeholder="Selecione ou digite o vencimento"
                              onChange={(value) => setBoletoForm({ ...boletoForm, dataVencimento: value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="valorAvulso">Valor personalizado*</Label>
                            <Input
                              id="valorAvulso"
                              inputMode="decimal"
                              placeholder="Ex.: 1.250,00"
                              value={boletoForm.valorAvulso}
                              onChange={(event) => setBoletoForm({ ...boletoForm, valorAvulso: event.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="motivoCobranca">Motivo da cobrança / descrição*</Label>
                          <textarea
                            id="motivoCobranca"
                            className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Descreva o motivo da cobrança. Esse texto será registrado na descrição do boleto."
                            value={boletoForm.motivoCobranca}
                            onChange={(event) => setBoletoForm({ ...boletoForm, motivoCobranca: event.target.value })}
                          />
                        </div>

                        <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
                          <p className="text-sm font-medium">Resumo do boleto avulso:</p>
                          <p className="text-2xl font-bold text-primary">
                            R$ {parseCurrencyInput(boletoForm.valorAvulso).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Cobrança sem vínculo com faixa. O motivo informado será enviado como descrição do boleto.
                          </p>
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
                            <p className="font-medium">{boletoForm.tipo === "contribuicao" ? `${contribuicaoLoteRows.length} empresa(s) selecionada(s)` : isBatchMode ? `${batchEmpresaIds.length} empresa(s) selecionada(s)` : boletoForm.empresaNome}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Tipo:</p>
                            <p className="font-medium">
                              {boletoForm.tipo === "contribuicao"
                                ? "Contribuição Assistencial"
                                : boletoForm.tipo === "avulso"
                                  ? "Boleto avulso"
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
                                <p className="font-medium">{getCompetenciaRangeLabel(boletoForm.competenciaInicial, boletoForm.competenciaFinal)}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Unificar Competências:</p>
                                <p className="font-medium">{boletoForm.unificarCompetencias}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Data de Vencimento:</p>
                                <p className="font-medium">{formatDateBR(boletoForm.dataVencimento)}</p>
                              </div>
                              {boletoForm.mensagemPersonalizada && (
                                <div className="col-span-2">
                                  <p className="font-semibold text-muted-foreground">Mensagem Personalizada:</p>
                                  <p className="font-medium">{boletoForm.mensagemPersonalizada}</p>
                                </div>
                              )}
                            </>
                          ) : boletoForm.tipo === "avulso" ? (
                            <>
                              <div>
                                <p className="font-semibold text-muted-foreground">Data de Vencimento:</p>
                                <p className="font-medium">{formatDateBR(boletoForm.dataVencimento)}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Valor personalizado:</p>
                                <p className="font-medium text-primary">
                                  R$ {parseCurrencyInput(boletoForm.valorAvulso).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="font-semibold text-muted-foreground">Motivo da cobrança / descrição:</p>
                                <p className="font-medium whitespace-pre-wrap">{boletoForm.motivoCobranca}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="font-semibold text-muted-foreground">Ano da Contribuição:</p>
                                <p className="font-medium">{boletoForm.anoContribuicao}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-muted-foreground">Percentual (%):</p>
                                <p className="font-medium">{boletoForm.percentual}</p>
                              </div>
                              <div className="col-span-2 overflow-x-auto rounded-md border">
                                <Table>
                                  <TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Folha de agosto</TableHead><TableHead>Origem</TableHead><TableHead>Contribuição</TableHead><TableHead>Boletos</TableHead></TableRow></TableHeader>
                                  <TableBody>{contribuicaoLoteRows.map((row) => {
                                    const folha = parseCurrencyInput(row.folhaAtual);
                                    const valor = folha * (Number(boletoForm.percentual.replace(",", ".")) || 0) / 100;
                                    return <TableRow key={row.empresaId}><TableCell className="font-medium">{row.empresaNome}</TableCell><TableCell>{formatCurrencyBRL(folha)}</TableCell><TableCell>{row.repetiuFolhaAnterior ? <Badge variant="outline">Repetida do ano anterior</Badge> : <Badge variant="secondary">Informada</Badge>}</TableCell><TableCell className="font-semibold">{formatCurrencyBRL(valor)}</TableCell><TableCell className="max-w-72 text-xs">{row.quantidadeParcelas === 1 ? getDescricaoContribuicao(boletoForm.anoContribuicao, 1, 1) : <><div>{getDescricaoContribuicao(boletoForm.anoContribuicao, 1, 2)}</div><div>{getDescricaoContribuicao(boletoForm.anoContribuicao, 2, 2)}</div></>}</TableCell></TableRow>;
                                  })}</TableBody>
                                </Table>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20 mt-4">
                          <p className="text-sm font-semibold text-muted-foreground">Valor estimado:</p>
                          <p className="text-3xl font-bold text-primary">
                            {boletoForm.tipo === "contribuicao"
                              ? formatCurrencyBRL(contribuicaoLoteRows.reduce((total, row) => total + parseCurrencyInput(row.folhaAtual) * (Number(boletoForm.percentual.replace(",", ".")) || 0) / 100, 0))
                              : boletoForm.tipo === "avulso"
                                ? `R$ ${parseCurrencyInput(boletoForm.valorAvulso).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : `R$ ${getMensalidadePreview().valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
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
                  {isEmittingBoletos && batchEmissionProgress.total > 0 && (
                    <div className="w-full space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Emitindo boletos...</span>
                        <span>{batchEmissionProgress.done}/{batchEmissionProgress.total}</span>
                      </div>
                      <Progress value={(batchEmissionProgress.done / batchEmissionProgress.total) * 100} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetWizard} disabled={isEmittingBoletos}>
                      Cancelar
                    </Button>
                    {wizardStep < 3 ? (
                      <Button onClick={handleNextStep} disabled={!canProceed}>
                        Próximo
                      </Button>
                    ) : (
                      <Button onClick={() => void handleEmitirBoleto()} disabled={isEmittingBoletos || createBoletoMutation.isPending} className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                        {isEmittingBoletos || createBoletoMutation.isPending ? "Emitindo..." : boletoForm.tipo === "contribuicao" ? "Gerar boletos do lote" : "Emitir"}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={emailFallbackDialogOpen} onOpenChange={(open) => {
              if (isResolvingEmailFallback) return;
              setEmailFallbackDialogOpen(open);
            }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>E-mail necessário para emissão</DialogTitle>
                  <DialogDescription>
                    A EFI exige um e-mail para gerar o boleto. Informe um e-mail para cadastrar na empresa ou use o e-mail do sindicato.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                    {emailFallbackEmpresaIds.length === 1
                      ? `Empresa sem e-mail: ${mockEmpresas.find((empresa) => empresa.id === emailFallbackEmpresaIds[0])?.nome || "empresa selecionada"}.`
                      : `${emailFallbackEmpresaIds.length} empresa(s) selecionada(s) não possuem e-mail cadastrado.`}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-fallback">E-mail da empresa</Label>
                    <Input
                      id="email-fallback"
                      type="email"
                      placeholder="email@empresa.com"
                      value={emailFallbackDraft}
                      onChange={(event) => setEmailFallbackDraft(event.target.value)}
                      disabled={isResolvingEmailFallback}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ao salvar, este e-mail será cadastrado na empresa antes da emissão.
                    </p>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                  <Button variant="outline" onClick={() => setEmailFallbackDialogOpen(false)} disabled={isResolvingEmailFallback}>
                    Cancelar emissão
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => void handleResolveMissingEmail(SINDICATO_EMAIL, false)}
                      disabled={isResolvingEmailFallback}
                    >
                      Usar e-mail do sindicato
                    </Button>
                    <Button
                      onClick={() => void handleResolveMissingEmail(emailFallbackDraft, true)}
                      disabled={isResolvingEmailFallback || !emailFallbackDraft.trim()}
                    >
                      {isResolvingEmailFallback ? "Continuando..." : "Salvar e continuar"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={comunicacaoDialogOpen} onOpenChange={setComunicacaoDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Histórico de comunicação - {selectedEmpresaComunicacao}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/20">
                    {data?.empresas.find((e) => e.razao_social === selectedEmpresaComunicacao)?.observacoes || "Sem histórico."}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nova-nota-comunicacao">Nova nota</Label>
                    <textarea
                      id="nova-nota-comunicacao"
                      className="w-full min-h-24 rounded-md border bg-background p-3 text-sm"
                      placeholder="Adicione uma observação de contato..."
                      value={novaNotaComunicacao}
                      onChange={(e) => setNovaNotaComunicacao(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setComunicacaoDialogOpen(false)} disabled={isSavingNotaComunicacao}>
                    Fechar
                  </Button>
                  <Button
                    disabled={isSavingNotaComunicacao || !novaNotaComunicacao.trim()}
                    onClick={async () => {
                      if (!selectedEmpresaComunicacao || !novaNotaComunicacao.trim()) return;
                      try {
                        setIsSavingNotaComunicacao(true);
                        await appendObservacaoEmpresa(selectedEmpresaComunicacao, novaNotaComunicacao.trim());
                        setNovaNotaComunicacao("");
                        toast({ title: "Nota adicionada ao histórico" });
                      } finally {
                        setIsSavingNotaComunicacao(false);
                      }
                    }}
                  >
                    {isSavingNotaComunicacao ? "Salvando..." : "Adicionar nota"}
                  </Button>
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
  type BoletoView = BoletoRegistro & {
    empresaId?: string;
    empresaFantasia?: string;
    efiChargeId?: string | null;
    pdfUrl?: string | null;
    descricao?: string;
    enviadoEmailEm?: string | null;
    enviadoWhatsappEm?: string | null;
    enviadoEmailPara?: string | null;
    enviadoWhatsappPara?: string | null;
    ultimoEnvioBoletoEm?: string | null;
    ultimoEnvioBoletoCanal?: string | null;
  };
