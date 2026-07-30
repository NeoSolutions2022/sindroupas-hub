import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Search, Send, Users } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hasuraRequest } from "@/lib/api/hasura";

const RECEITA_WS_PROXY_BASE_PATH = "/api/receitaws/v1/cnpj";
const VIA_CEP_BASE_URL = "https://viacep.com.br/ws";

const porteOptions = [
  { value: "MEI", label: "MEI (até R$ 81.000,00)" },
  { value: "ME", label: "ME (até R$ 360 mil)" },
  { value: "EPP", label: "EPP (de R$ 360 mil a R$ 4,8 milhões)" },
  { value: "Médias e Grandes Empresas", label: "Médias e Grandes Empresas (acima de R$ 4,8 milhões)" },
] as const;

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

type ReceitaWsResponse = {
  status?: "OK" | "ERROR" | string;
  message?: string;
  cnpj?: string;
  abertura?: string;
  nome?: string;
  fantasia?: string;
  porte?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  email?: string;
  telefone?: string;
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

type SocioReceitaWs = {
  nome: string;
  qualificacao?: string;
  paisOrigem?: string;
  nomeRepresentanteLegal?: string;
  qualificacaoRepresentanteLegal?: string;
};

type AtividadeReceitaWs = {
  codigo: string;
  descricao: string;
  principal: boolean;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

const formatCnpj = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);

const formatCpf = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{2})$/, "$1-$2")
    .slice(0, 14);

const formatPhone = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .slice(0, 15);

const formatCep = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);

const parseReceitaWsDate = (value?: string) => {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const normalizeSearchText = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeReceitaWsPorte = (value?: string, capitalSocial?: string) => {
  const normalized = normalizeSearchText(value);
  const capital = Number((capitalSocial ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));

  if (normalized.includes("mei") || normalized.includes("microempreendedor")) return "MEI";
  if (normalized.includes("micro empresa") || normalized.includes("microempresa")) return "ME";
  if (normalized.includes("pequeno porte") || normalized.includes("epp")) return "EPP";
  if (Number.isFinite(capital) && capital > 4_800_000) return "Médias e Grandes Empresas";
  if (normalized.includes("demais") || normalized.includes("grande")) return "Médias e Grandes Empresas";
  return "";
};

const parseReceitaWsCapital = (value?: string) => {
  if (!value) return "";
  const parsed = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? String(parsed) : "";
};

type CadastroPublicoForm = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  whatsapp: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  porte: string;
  capitalSocial: string;
  dataFundacao: string;
  qtdFuncionarios: string;
  responsavelNome: string;
  responsavelCpf: string;
  responsavelEmail: string;
  responsavelWhatsapp: string;
  responsavelDataNascimento: string;
  observacoes: string;
};

const initialForm: CadastroPublicoForm = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  email: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  uf: "",
  porte: "",
  capitalSocial: "",
  dataFundacao: "",
  qtdFuncionarios: "",
  responsavelNome: "",
  responsavelCpf: "",
  responsavelEmail: "",
  responsavelWhatsapp: "",
  responsavelDataNascimento: "",
  observacoes: "",
};

const CadastroAssociadoPublico = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<CadastroPublicoForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpCnpj, setIsLookingUpCnpj] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sociosReceitaWs, setSociosReceitaWs] = useState<SocioReceitaWs[]>([]);
  const [atividadesReceitaWs, setAtividadesReceitaWs] = useState<AtividadeReceitaWs[]>([]);
  const lastReceitaWsLookupRef = useRef("");
  const lastCepLookupRef = useRef("");

  const requiredFields = useMemo(
    () => [
      form.cnpj.replace(/\D/g, "").length === 14,
      form.razaoSocial.trim(),
      form.porte.trim(),
      form.email.trim() || form.responsavelEmail.trim(),
      form.responsavelNome.trim(),
      form.responsavelWhatsapp.replace(/\D/g, "").length >= 10,
    ],
    [form],
  );

  const canSubmit = requiredFields.every(Boolean);

  const updateForm = (field: keyof CadastroPublicoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildEnderecoFromForm = () => {
    const street = [form.logradouro.trim(), form.numero.trim()].filter(Boolean).join(", ");
    const details = [form.complemento.trim(), form.bairro.trim()].filter(Boolean).join(" - ");
    const city = [form.municipio.trim(), form.uf.trim()].filter(Boolean).join("/");
    const cep = form.cep.trim() ? `CEP ${form.cep.trim()}` : "";
    return [street, details, city, cep].filter(Boolean).join(" • ");
  };

  const applyReceitaWsData = (payload: ReceitaWsResponse, cnpj: string) => {
    const porte = normalizeReceitaWsPorte(payload.porte, payload.capital_social);

    setForm((prev) => ({
      ...prev,
      cnpj: formatCnpj(payload.cnpj || cnpj),
      razaoSocial: payload.nome?.trim() || prev.razaoSocial,
      nomeFantasia: payload.fantasia?.trim() || prev.nomeFantasia || payload.nome?.trim() || "",
      email: payload.email?.trim().toLowerCase() || prev.email,
      whatsapp: payload.telefone ? formatPhone(payload.telefone) : prev.whatsapp,
      cep: payload.cep ? formatCep(payload.cep) : prev.cep,
      logradouro: payload.logradouro?.trim() || prev.logradouro,
      numero: payload.numero?.trim() || prev.numero,
      complemento: payload.complemento?.trim() || prev.complemento,
      bairro: payload.bairro?.trim() || prev.bairro,
      municipio: payload.municipio?.trim() || prev.municipio,
      uf: payload.uf?.trim() || prev.uf,
      porte: porte || prev.porte,
      capitalSocial: parseReceitaWsCapital(payload.capital_social) || prev.capitalSocial,
      dataFundacao: parseReceitaWsDate(payload.abertura) || prev.dataFundacao,
    }));
    setSociosReceitaWs(
      (payload.qsa ?? [])
        .filter((socio) => socio.nome?.trim())
        .map((socio) => ({
          nome: socio.nome!.trim(),
          qualificacao: socio.qual?.trim() || undefined,
          paisOrigem: socio.pais_origem?.trim() || undefined,
          nomeRepresentanteLegal: socio.nome_rep_legal?.trim() || undefined,
          qualificacaoRepresentanteLegal: socio.qual_rep_legal?.trim() || undefined,
        })),
    );
    setAtividadesReceitaWs(
      [
        ...(payload.atividade_principal ?? []).map((atividade) => ({ ...atividade, principal: true })),
        ...(payload.atividades_secundarias ?? []).map((atividade) => ({ ...atividade, principal: false })),
      ]
        .filter((atividade) => atividade.code?.trim() && atividade.text?.trim())
        .map((atividade) => ({
          codigo: atividade.code!.trim(),
          descricao: atividade.text!.trim(),
          principal: atividade.principal,
        })),
    );
  };

  const handleReceitaWsLookup = async (cnpjValue = form.cnpj, options?: { silent?: boolean }) => {
    const cnpjDigits = cnpjValue.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      if (!options?.silent) {
        toast({
          title: "CNPJ incompleto",
          description: "Informe os 14 dígitos do CNPJ para buscar os dados da empresa.",
          variant: "destructive",
        });
      }
      return;
    }

    if (isLookingUpCnpj || (options?.silent && lastReceitaWsLookupRef.current === cnpjDigits)) return;

    try {
      setIsLookingUpCnpj(true);
      lastReceitaWsLookupRef.current = cnpjDigits;
      const response = await fetch(`${RECEITA_WS_PROXY_BASE_PATH}/${cnpjDigits}`);
      const payload = (await response.json()) as ReceitaWsResponse;

      if (!response.ok || payload.status === "ERROR") {
        throw new Error(payload.message || "Não foi possível consultar esse CNPJ na ReceitaWS.");
      }

      applyReceitaWsData(payload, cnpjDigits);
      if (!options?.silent) {
        toast({
          title: "Dados localizados",
          description: "Preenchi automaticamente as informações disponíveis na ReceitaWS.",
        });
      }
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: "Falha ao consultar CNPJ",
          description: error instanceof Error ? error.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLookingUpCnpj(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    const formattedCnpj = formatCnpj(value);
    setForm((prev) => ({ ...prev, cnpj: formattedCnpj }));

    const digits = formattedCnpj.replace(/\D/g, "");
    if (digits.length === 14 && lastReceitaWsLookupRef.current !== digits) {
      void handleReceitaWsLookup(formattedCnpj, { silent: true });
    }
  };

  const applyViaCepData = (payload: ViaCepResponse) => {
    setForm((prev) => ({
      ...prev,
      cep: payload.cep ? formatCep(payload.cep) : prev.cep,
      logradouro: payload.logradouro?.trim() || prev.logradouro,
      complemento: payload.complemento?.trim() || prev.complemento,
      bairro: payload.bairro?.trim() || prev.bairro,
      municipio: payload.localidade?.trim() || prev.municipio,
      uf: payload.uf?.trim() || prev.uf,
    }));
  };

  const handleCepLookup = async (cepValue = form.cep, options?: { silent?: boolean }) => {
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
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: "Falha ao consultar CEP",
          description: error instanceof Error ? error.message : "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formattedCep = formatCep(value);
    setForm((prev) => ({ ...prev, cep: formattedCep }));

    const digits = formattedCep.replace(/\D/g, "");
    if (digits.length === 8 && lastCepLookupRef.current !== digits) {
      void handleCepLookup(formattedCep, { silent: true });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Revise os campos obrigatórios",
        description: "Informe CNPJ, razão social, porte, contato e responsável legal.",
        variant: "destructive",
      });
      return;
    }

    const endereco = buildEnderecoFromForm();

    try {
      setIsSubmitting(true);
      await hasuraRequest({
        query: `
          mutation InserirSolicitacaoAssociacao($input: solicitacoes_associacao_insert_input!) {
            insert_solicitacoes_associacao_one(object: $input) { id }
          }
        `,
        variables: {
          input: {
            cnpj: form.cnpj,
            razao_social: form.razaoSocial.trim(),
            nome_fantasia: form.nomeFantasia.trim() || null,
            email: form.email.trim().toLowerCase() || null,
            whatsapp: form.whatsapp || null,
            endereco: endereco || null,
            porte: form.porte.trim() || null,
            capital_social: form.capitalSocial ? Number(form.capitalSocial) : null,
            data_fundacao: form.dataFundacao || null,
            qtd_funcionarios: form.qtdFuncionarios ? Number(form.qtdFuncionarios) : null,
            responsavel_nome: form.responsavelNome.trim(),
            responsavel_cpf: form.responsavelCpf || null,
            responsavel_email: form.responsavelEmail.trim().toLowerCase() || null,
            responsavel_whatsapp: form.responsavelWhatsapp,
            responsavel_data_nascimento: form.responsavelDataNascimento || null,
            observacoes: form.observacoes.trim() || null,
            payload: {
              responsaveis: [
                {
                  nome: form.responsavelNome.trim(),
                  cpf: form.responsavelCpf,
                  email: form.responsavelEmail.trim().toLowerCase(),
                  whatsapp: form.responsavelWhatsapp,
                  dataAniversario: form.responsavelDataNascimento,
                  contatoPrincipal: true,
                },
              ],
              colaboradores: [],
              relacionamentos: [],
              socios: sociosReceitaWs,
              atividadesEconomicas: atividadesReceitaWs,
              enderecoDetalhado: {
                cep: form.cep,
                logradouro: form.logradouro,
                numero: form.numero,
                complemento: form.complemento,
                bairro: form.bairro,
                municipio: form.municipio,
                uf: form.uf,
              },
            },
          },
        },
      });

      setSubmitted(true);
      setForm(initialForm);
      setSociosReceitaWs([]);
      setAtividadesReceitaWs([]);
      toast({
        title: "Solicitação enviada",
        description: "Seu cadastro foi encaminhado para análise do SindRoupas.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível enviar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SindRoupas" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1C]">SindRoupas</p>
              <p className="text-xs text-muted-foreground">Cadastro público de associado</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Área restrita</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.4fr]">
        <section className="space-y-4">
          <Card className="border-[#DCE7CB] shadow-sm">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#DCE7CB] text-[#1C1C1C]">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl text-[#1C1C1C]">Associe sua empresa</CardTitle>
              <CardDescription>
                Envie seus dados para análise. Após aprovação, a equipe do sindicato concluirá o cadastro e entrará em contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3 rounded-xl bg-[#F7F8F4] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A86B]" />
                <span>Seus dados ficam pendentes até validação administrativa.</span>
              </div>
              <div className="flex gap-3 rounded-xl bg-[#F7F8F4] p-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#7E8C5E]" />
                <span>Informe um responsável principal para priorizarmos o contato.</span>
              </div>
            </CardContent>
          </Card>

          {submitted && (
            <Card className="border-[#00A86B]/40 bg-[#00A86B]/10">
              <CardContent className="p-4 text-sm text-[#1C1C1C]">
                Solicitação recebida com sucesso. Aguarde o retorno da equipe SindRoupas.
              </CardContent>
            </Card>
          )}
        </section>

        <Card className="border-[#DCE7CB] shadow-sm">
          <CardHeader>
            <CardTitle>Dados para análise</CardTitle>
            <CardDescription>Campos com * são necessários para enviar a solicitação.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ*</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(event) => handleCnpjChange(event.target.value)}
                      onBlur={() => void handleReceitaWsLookup(form.cnpj, { silent: true })}
                      placeholder="00.000.000/0000-00"
                      disabled={isLookingUpCnpj}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleReceitaWsLookup()}
                      disabled={isLookingUpCnpj || form.cnpj.replace(/\D/g, "").length !== 14}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {isLookingUpCnpj ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ao informar o CNPJ, buscamos os dados públicos para facilitar o preenchimento.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social*</Label>
                  <Input id="razaoSocial" value={form.razaoSocial} onChange={(event) => updateForm("razaoSocial", event.target.value)} placeholder="Razão social da empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input id="nomeFantasia" value={form.nomeFantasia} onChange={(event) => updateForm("nomeFantasia", event.target.value)} placeholder="Nome fantasia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail da empresa</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp da empresa</Label>
                  <Input id="whatsapp" value={form.whatsapp} onChange={(event) => updateForm("whatsapp", formatPhone(event.target.value))} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qtdFuncionarios">Quantidade de funcionários</Label>
                  <Input id="qtdFuncionarios" type="number" min="0" value={form.qtdFuncionarios} onChange={(event) => updateForm("qtdFuncionarios", event.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porte">Porte da Empresa*</Label>
                  <Select value={form.porte || undefined} onValueChange={(value) => updateForm("porte", value)}>
                    <SelectTrigger id="porte">
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                    <SelectContent>
                      {porteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFundacao">Data de fundação</Label>
                  <Input id="dataFundacao" type="date" value={form.dataFundacao} onChange={(event) => updateForm("dataFundacao", event.target.value)} />
                </div>
              </div>

              {(sociosReceitaWs.length > 0 || atividadesReceitaWs.length > 0) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#DCE7CB] bg-[#FBFCF8] p-4">
                    <h2 className="font-semibold text-[#1C1C1C]">Quadro societário localizado</h2>
                    <p className="mb-3 text-xs text-muted-foreground">Esses dados serão encaminhados para revisão do sindicato.</p>
                    {sociosReceitaWs.length ? (
                      <div className="space-y-2">
                        {sociosReceitaWs.map((socio, index) => (
                          <div key={`${socio.nome}-${index}`} className="rounded-md border bg-white p-2 text-sm">
                            <p className="font-medium">{socio.nome}</p>
                            <p className="text-xs text-muted-foreground">{socio.qualificacao || "Qualificação não informada"}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Nenhum sócio retornado.</p>}
                  </div>
                  <div className="rounded-xl border border-[#DCE7CB] bg-[#FBFCF8] p-4">
                    <h2 className="font-semibold text-[#1C1C1C]">Atividades econômicas localizadas</h2>
                    <p className="mb-3 text-xs text-muted-foreground">CNAE principal e atividades secundárias retornadas pela ReceitaWS.</p>
                    {atividadesReceitaWs.length ? (
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {atividadesReceitaWs.map((atividade, index) => (
                          <div key={`${atividade.codigo}-${index}`} className="rounded-md border bg-white p-2 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{atividade.codigo}</span>
                              {atividade.principal && <span className="rounded-full bg-[#DCE7CB] px-2 py-0.5 text-[10px] font-semibold">Principal</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Nenhuma atividade retornada.</p>}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#DCE7CB] bg-white p-4">
                <div className="mb-4">
                  <h2 className="font-semibold text-[#1C1C1C]">Endereço da empresa</h2>
                  <p className="text-sm text-muted-foreground">
                    Informe o CEP para preencher automaticamente com a ViaCEP; no envio, os dados serão consolidados no campo único de endereço da empresa.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={form.cep}
                        onChange={(event) => handleCepChange(event.target.value)}
                        onBlur={() => void handleCepLookup(form.cep, { silent: true })}
                        placeholder="00000-000"
                        disabled={isLookingUpCep}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleCepLookup()}
                        disabled={isLookingUpCep || form.cep.replace(/\D/g, "").length !== 8}
                        className="shrink-0"
                      >
                        {isLookingUpCep ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="logradouro">Rua / Logradouro</Label>
                    <Input id="logradouro" value={form.logradouro} onChange={(event) => updateForm("logradouro", event.target.value)} placeholder="Rua, avenida, travessa..." />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" value={form.numero} onChange={(event) => updateForm("numero", event.target.value)} placeholder="123" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" value={form.complemento} onChange={(event) => updateForm("complemento", event.target.value)} placeholder="Sala, bloco, loja..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" value={form.bairro} onChange={(event) => updateForm("bairro", event.target.value)} placeholder="Bairro" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="uf">Estado</Label>
                    <Select value={form.uf || undefined} onValueChange={(value) => updateForm("uf", value)}>
                      <SelectTrigger id="uf">
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
                    <Label htmlFor="municipio">Cidade</Label>
                    <Input id="municipio" value={form.municipio} onChange={(event) => updateForm("municipio", event.target.value)} placeholder="Cidade" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4">
                <h2 className="font-semibold text-[#1C1C1C]">Responsável legal</h2>
                <p className="mb-4 text-sm text-muted-foreground">Essa pessoa será priorizada no contato da equipe.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="responsavelNome">Nome do responsável legal*</Label>
                    <Input id="responsavelNome" value={form.responsavelNome} onChange={(event) => updateForm("responsavelNome", event.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavelCpf">CPF</Label>
                    <Input id="responsavelCpf" value={form.responsavelCpf} onChange={(event) => updateForm("responsavelCpf", formatCpf(event.target.value))} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavelEmail">E-mail do responsável</Label>
                    <Input id="responsavelEmail" type="email" value={form.responsavelEmail} onChange={(event) => updateForm("responsavelEmail", event.target.value)} placeholder="responsavel@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavelWhatsapp">WhatsApp do responsável*</Label>
                    <Input id="responsavelWhatsapp" value={form.responsavelWhatsapp} onChange={(event) => updateForm("responsavelWhatsapp", formatPhone(event.target.value))} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavelDataNascimento">Data de nascimento</Label>
                    <Input id="responsavelDataNascimento" type="date" value={form.responsavelDataNascimento} onChange={(event) => updateForm("responsavelDataNascimento", event.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" value={form.observacoes} onChange={(event) => updateForm("observacoes", event.target.value)} placeholder="Conte brevemente sua necessidade ou observações para o sindicato." />
              </div>

              <Button type="submit" className="w-full bg-[#1C1C1C] hover:bg-[#1C1C1C]/90" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar para aprovação"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CadastroAssociadoPublico;
