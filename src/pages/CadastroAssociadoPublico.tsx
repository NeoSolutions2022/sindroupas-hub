import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Send, Users } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hasuraRequest } from "@/lib/api/hasura";

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

type CadastroPublicoForm = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  whatsapp: string;
  endereco: string;
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
  endereco: "",
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
  const [submitted, setSubmitted] = useState(false);

  const requiredFields = useMemo(
    () => [
      form.cnpj.replace(/\D/g, "").length === 14,
      form.razaoSocial.trim(),
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Revise os campos obrigatórios",
        description: "Informe CNPJ, razão social, contato e responsável principal.",
        variant: "destructive",
      });
      return;
    }

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
            endereco: form.endereco.trim() || null,
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
            },
          },
        },
      });

      setSubmitted(true);
      setForm(initialForm);
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
                  <Input id="cnpj" value={form.cnpj} onChange={(event) => updateForm("cnpj", formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" />
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
                  <Label htmlFor="porte">Porte</Label>
                  <Input id="porte" value={form.porte} onChange={(event) => updateForm("porte", event.target.value)} placeholder="ME, EPP, LTDA..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFundacao">Data de fundação</Label>
                  <Input id="dataFundacao" type="date" value={form.dataFundacao} onChange={(event) => updateForm("dataFundacao", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={form.endereco} onChange={(event) => updateForm("endereco", event.target.value)} placeholder="Rua, número, bairro, cidade/UF" />
                </div>
              </div>

              <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4">
                <h2 className="font-semibold text-[#1C1C1C]">Responsável principal</h2>
                <p className="mb-4 text-sm text-muted-foreground">Essa pessoa será priorizada no contato da equipe.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="responsavelNome">Nome*</Label>
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
