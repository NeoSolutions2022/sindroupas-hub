import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { ArrowLeft, Building2, Calculator, Download, Mail, MessageCircle, ReceiptText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { hasuraRequest } from "@/lib/api/hasura";

type BoletoDetalheRow = {
  id: string;
  efi_charge_id?: string | null;
  pdf_url?: string | null;
  tipo?: string | null;
  valor?: number | string | null;
  vencimento?: string | null;
  status?: string | null;
  efi_status?: string | null;
  descricao?: string | null;
  competencia_inicial?: string | null;
  competencia_final?: string | null;
  faixa_id?: string | null;
  linha_digitavel?: string | null;
  efi_barcode?: string | null;
  efi_pix_txid?: string | null;
  ano?: string | null;
  periodicidade?: number | string | null;
  parcelas?: number | null;
  base?: number | string | null;
  percentual?: number | string | null;
  descontos?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  enviado_email_em?: string | null;
  enviado_whatsapp_em?: string | null;
  enviado_email_para?: string | null;
  enviado_whatsapp_para?: string | null;
  ultimo_envio_boleto_em?: string | null;
  ultimo_envio_boleto_canal?: string | null;
  empresa?: {
    id: string;
    razao_social: string;
    nome_fantasia?: string | null;
    cnpj?: string | null;
    email?: string | null;
    whatsapp?: string | null;
  } | null;
};

type FaixaDetalheRow = {
  id: string;
  label?: string | null;
  min_colaboradores?: number | null;
  max_colaboradores?: number | null;
  valor_mensalidade?: number | string | null;
};

const FINANCEIRO_DETALHE_QUERY = `
  query FinanceiroBoletoDetalhe($id: uuid!) {
    financeiro_boletos_by_pk(id: $id) {
      id
      efi_charge_id
      pdf_url
      tipo
      valor
      vencimento
      status
      efi_status
      descricao
      competencia_inicial
      competencia_final
      faixa_id
      linha_digitavel
      efi_barcode
      efi_pix_txid
      ano
      periodicidade
      parcelas
      base
      percentual
      descontos
      created_at
      updated_at
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
        cnpj
        email
        whatsapp
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

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsed);
};

const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, includeTime ? "dd/MM/yyyy 'às' HH:mm" : "dd/MM/yyyy");
};

const formatCompetencia = (value?: string | null) => {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MM/yyyy") : value;
};

const formatCnpj = (value?: string | null) => {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length !== 14) return value || "—";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const getStatusLabel = (status?: string | null) => {
  const normalized = status?.trim().toLowerCase();
  if (["pago", "paid", "liquidado", "recebido"].includes(normalized ?? "")) return "Pago";
  if (["cancelado", "canceled", "cancelled"].includes(normalized ?? "")) return "Cancelado";
  if (["inadimplente", "atrasado", "vencido", "overdue"].includes(normalized ?? "")) return "Inadimplente";
  return "Aguardando";
};

const DetailField = ({ label, value, className = "" }: { label: string; value: ReactNode; className?: string }) => (
  <div className={className}>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="mt-1 break-words text-sm font-medium">{value || "—"}</div>
  </div>
);

const FinanceiroDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["financeiro-boleto-detalhe", id],
    enabled: Boolean(id),
    queryFn: () => hasuraRequest<{ financeiro_boletos_by_pk: BoletoDetalheRow | null; faixas: FaixaDetalheRow[] }>({
      query: FINANCEIRO_DETALHE_QUERY,
      variables: { id },
      token,
    }),
  });

  const boleto = data?.financeiro_boletos_by_pk;
  const faixa = data?.faixas.find((item) => item.id === boleto?.faixa_id);
  const status = getStatusLabel(boleto?.efi_status || boleto?.status);
  const competencia = boleto?.competencia_inicial === boleto?.competencia_final
    ? formatCompetencia(boleto?.competencia_inicial)
    : `${formatCompetencia(boleto?.competencia_inicial)} a ${formatCompetencia(boleto?.competencia_final)}`;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => navigate("/dashboard/financeiro")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold">Detalhes do boleto</h1>
                  <p className="truncate text-sm text-muted-foreground">{boleto?.empresa?.razao_social || "Informações completas da cobrança"}</p>
                </div>
                {boleto && (
                  <Badge variant={status === "Cancelado" || status === "Inadimplente" ? "destructive" : status === "Pago" ? "default" : "secondary"}>
                    {status}
                  </Badge>
                )}
              </div>

              {isLoading && <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando os dados do boleto...</CardContent></Card>}
              {error && <Card className="border-destructive/40"><CardContent className="p-8 text-center text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar o boleto."}</CardContent></Card>}
              {!isLoading && !error && !boleto && <Card><CardContent className="p-8 text-center text-muted-foreground">Boleto não encontrado.</CardContent></Card>}

              {boleto && (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Empresa</CardTitle></CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <DetailField label="Razão social" value={boleto.empresa?.razao_social} />
                        <DetailField label="Nome fantasia" value={boleto.empresa?.nome_fantasia} />
                        <DetailField label="CNPJ" value={formatCnpj(boleto.empresa?.cnpj)} />
                        <DetailField label="ID da empresa" value={boleto.empresa?.id} />
                        <DetailField label="E-mail" value={boleto.empresa?.email} />
                        <DetailField label="WhatsApp" value={boleto.empresa?.whatsapp} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" />Cobrança</CardTitle></CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <DetailField label="Valor" value={<span className="text-xl font-bold text-primary">{formatCurrency(boleto.valor)}</span>} />
                        <DetailField label="Vencimento" value={formatDate(boleto.vencimento)} />
                        <DetailField label="Data de emissão" value={formatDate(boleto.created_at, true)} />
                        <DetailField label="Última atualização" value={formatDate(boleto.updated_at, true)} />
                        <DetailField label="Tipo" value={boleto.tipo} />
                        <DetailField label="Status apresentado" value={status} />
                        <DetailField label="Status interno" value={boleto.status} />
                        <DetailField label="Status da EFI" value={boleto.efi_status} />
                        <DetailField label="ID interno" value={boleto.id} />
                        <DetailField label="Charge ID da EFI" value={boleto.efi_charge_id} />
                        <DetailField label="Descrição" value={boleto.descricao} className="sm:col-span-2" />
                        <DetailField label="Linha digitável" value={<span className="break-all font-mono text-xs">{boleto.linha_digitavel || "—"}</span>} className="sm:col-span-2" />
                        <DetailField label="Barcode EFI" value={<span className="break-all font-mono text-xs">{boleto.efi_barcode || "—"}</span>} className="sm:col-span-2" />
                        <DetailField label="Pix TXID" value={<span className="break-all font-mono text-xs">{boleto.efi_pix_txid || "—"}</span>} className="sm:col-span-2" />
                        <div className="sm:col-span-2">
                          {boleto.pdf_url ? (
                            <Button asChild className="w-full"><a href={boleto.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Baixar boleto em PDF</a></Button>
                          ) : (
                            <Button className="w-full" disabled><Download className="mr-2 h-4 w-4" />PDF indisponível</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Competência e cálculo</CardTitle></CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <DetailField label="Competência considerada" value={competencia} />
                      <DetailField label="Competência inicial" value={formatCompetencia(boleto.competencia_inicial)} />
                      <DetailField label="Competência final" value={formatCompetencia(boleto.competencia_final)} />
                      <DetailField label="Ano" value={boleto.ano} />
                      <DetailField label="Periodicidade" value={boleto.periodicidade} />
                      <DetailField label="Parcelas" value={boleto.parcelas} />
                      <DetailField label="Base de cálculo" value={formatCurrency(boleto.base)} />
                      <DetailField label="Percentual" value={boleto.percentual !== null && boleto.percentual !== undefined ? `${boleto.percentual}%` : "—"} />
                      <DetailField label="Descontos" value={formatCurrency(boleto.descontos)} />
                      <DetailField label="Faixa" value={faixa ? `${faixa.label || `${faixa.min_colaboradores ?? 0}–${faixa.max_colaboradores ?? 0}`} • ${formatCurrency(faixa.valor_mensalidade)}` : "—"} />
                      <DetailField label="ID da faixa" value={boleto.faixa_id} className="lg:col-span-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Comunicação do boleto</CardTitle></CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailField label="Enviado por e-mail em" value={formatDate(boleto.enviado_email_em, true)} />
                      <DetailField label="Destinatário do e-mail" value={boleto.enviado_email_para ? <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{boleto.enviado_email_para}</span> : "—"} />
                      <DetailField label="Enviado por WhatsApp em" value={formatDate(boleto.enviado_whatsapp_em, true)} />
                      <DetailField label="Destinatário do WhatsApp" value={boleto.enviado_whatsapp_para ? <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />{boleto.enviado_whatsapp_para}</span> : "—"} />
                      <DetailField label="Último envio" value={formatDate(boleto.ultimo_envio_boleto_em, true)} />
                      <DetailField label="Canal do último envio" value={boleto.ultimo_envio_boleto_canal} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FinanceiroDetalhe;
