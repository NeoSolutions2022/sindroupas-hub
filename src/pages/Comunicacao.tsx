import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasuraRequest } from "@/lib/api/hasura";
import { useAuth } from "@/contexts/AuthContext";
import { TablePagination } from "@/components/ui/table-pagination";
import { sendEvolutionTextRequest } from "@/lib/api/evolution";

type NotificacaoStatus = "enviado" | "entregue" | "lido";

interface Notificacao {
  id: number;
  empresa: string;
  canal: "WhatsApp" | "E-mail";
  mensagem: string;
  status: NotificacaoStatus;
  data: string;
}

const mockNotificacoesInicial: Notificacao[] = [
  {
    id: 1,
    empresa: "Confecções Aurora",
    canal: "WhatsApp",
    mensagem: "Por favor, atualize seus dados.",
    status: "entregue",
    data: "2025-03-15",
  },
  {
    id: 2,
    empresa: "ModaSul Ltda",
    canal: "E-mail",
    mensagem: "Lembrete de pagamento mensal.",
    status: "lido",
    data: "2025-03-14",
  },
];

const Comunicacao = () => {
  const { token } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(mockNotificacoesInicial);
  const [empresaFiltroObs, setEmpresaFiltroObs] = useState("");
  const [novaObservacaoByEmpresa, setNovaObservacaoByEmpresa] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifPageSize, setNotifPageSize] = useState(50);
  const [obsPage, setObsPage] = useState(1);
  const [obsPageSize, setObsPageSize] = useState(50);
  const [novaNotificacao, setNovaNotificacao] = useState({
    empresa: "",
    canal: "WhatsApp" as "WhatsApp" | "E-mail",
    mensagem: "",
    linkFormulario: "",
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { data: empresasData, refetch: refetchEmpresas } = useQuery({
    queryKey: ["comunicacao-empresas-observacoes"],
    queryFn: () =>
      hasuraRequest<{ empresas: { id: string; razao_social: string; observacoes?: string | null; whatsapp?: string | null; email?: string | null }[] }>({
        query: `
          query ComunicacaoEmpresas {
            empresas(order_by: { razao_social: asc }) {
              id
              razao_social
              observacoes
              whatsapp
              email
            }
          }
        `,
        token,
      }),
  });

  const handleEnviarNotificacao = async () => {
    if (!novaNotificacao.empresa || !novaNotificacao.mensagem) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const mensagemCompleta = novaNotificacao.linkFormulario
      ? `${novaNotificacao.mensagem} ${novaNotificacao.linkFormulario}`
      : novaNotificacao.mensagem;

    const mensagemComPlaceholder = mensagemCompleta.replace(
      /{{empresa}}/g,
      novaNotificacao.empresa
    );

    const empresaSelecionada = (empresasData?.empresas ?? []).find((item) => item.razao_social === novaNotificacao.empresa);
    if (!empresaSelecionada) {
      toast({ title: "Empresa não encontrada", variant: "destructive" });
      return;
    }

    const number = (empresaSelecionada.whatsapp ?? "").replace(/\D/g, "");
    if (!number) {
      toast({ title: "WhatsApp da empresa ausente", description: "Cadastre o WhatsApp da empresa para envio.", variant: "destructive" });
      return;
    }

    const novaNotif: Notificacao = {
      id: notificacoes.length + 1,
      empresa: novaNotificacao.empresa,
      canal: novaNotificacao.canal,
      mensagem: mensagemComPlaceholder,
      status: "enviado",
      data: new Date().toISOString().split("T")[0],
    };
    try {
      setIsSending(true);
      await sendEvolutionTextRequest({ number, text: mensagemComPlaceholder });
      setNotificacoes((prev) => [{ ...novaNotif, status: "entregue" }, ...prev]);
      await handleAdicionarObservacao(
        empresaSelecionada.id,
        empresaSelecionada.observacoes,
        `Notificação enviada via Evolution (${novaNotificacao.canal}): ${mensagemComPlaceholder}`,
      );
      toast({
        title: "Notificação enviada",
        description: `Mensagem enviada para ${novaNotificacao.empresa} via Evolution API`,
      });
      setNovaNotificacao({ empresa: "", canal: "WhatsApp", mensagem: "", linkFormulario: "" });
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Falha no envio",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: NotificacaoStatus) => {
    const config = {
      enviado: { variant: "secondary" as const, label: "Enviado" },
      entregue: { variant: "default" as const, label: "Entregue" },
      lido: { variant: "default" as const, label: "Lido" },
    };
    const { variant, label } = config[status];
    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    );
  };

  const getCanalIcon = (canal: "WhatsApp" | "E-mail") => {
    return canal === "WhatsApp" ? (
      <MessageCircle className="h-4 w-4" />
    ) : (
      <Mail className="h-4 w-4" />
    );
  };

  const empresasFiltradasObs = (empresasData?.empresas ?? []).filter((empresa) =>
    empresa.razao_social.toLowerCase().includes(empresaFiltroObs.toLowerCase()),
  );

  const paginatedNotificacoes = notificacoes.slice((notifPage - 1) * notifPageSize, notifPage * notifPageSize);
  const paginatedObs = empresasFiltradasObs.slice((obsPage - 1) * obsPageSize, obsPage * obsPageSize);

  const handleAdicionarObservacao = async (empresaId: string, observacoesAtuais?: string | null, notaDireta?: string) => {
    const novaObservacao = (notaDireta ?? novaObservacaoByEmpresa[empresaId] ?? "").trim();
    if (!novaObservacao) return;
    const stamp = new Date().toLocaleString("pt-BR");
    const novoHistorico = [`[${stamp}] ${novaObservacao.trim()}`, (observacoesAtuais ?? "").trim()]
      .filter(Boolean)
      .join("\n---\n");
    await hasuraRequest({
      query: `
        mutation AtualizarObservacoesEmpresa($id: uuid!, $observacoes: String) {
          update_empresas_by_pk(pk_columns: { id: $id }, _set: { observacoes: $observacoes }) { id }
        }
      `,
      variables: { id: empresaId, observacoes: novoHistorico },
      token,
    });
    setNovaObservacaoByEmpresa((prev) => ({ ...prev, [empresaId]: "" }));
    await refetchEmpresas();
    toast({ title: "Observação adicionada" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Central de Comunicação</h1>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Notificação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Notificação</DialogTitle>
                    <DialogDescription>
                      Envie mensagens personalizadas para os associados
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa</Label>
                      <Select
                        value={novaNotificacao.empresa}
                        onValueChange={(value) =>
                          setNovaNotificacao({ ...novaNotificacao, empresa: value })
                        }
                      >
                        <SelectTrigger id="empresa">
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {(empresasData?.empresas ?? []).map((empresa) => (
                            <SelectItem key={empresa.id} value={empresa.razao_social}>
                              {empresa.razao_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="canal">Canal de Envio</Label>
                      <Select
                        value={novaNotificacao.canal}
                        onValueChange={(value: "WhatsApp" | "E-mail") =>
                          setNovaNotificacao({ ...novaNotificacao, canal: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mensagem">Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        placeholder="Digite a mensagem. Use {{empresa}} para personalizar."
                        value={novaNotificacao.mensagem}
                        onChange={(e) =>
                          setNovaNotificacao({ ...novaNotificacao, mensagem: e.target.value })
                        }
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dica: Use {"{{empresa}}"} para inserir o nome da empresa automaticamente
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link">Link do Formulário Google (opcional)</Label>
                      <Input
                        id="link"
                        placeholder="https://forms.google.com/..."
                        value={novaNotificacao.linkFormulario}
                        onChange={(e) =>
                          setNovaNotificacao({ ...novaNotificacao, linkFormulario: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEnviarNotificacao} disabled={isSending}>
                      {isSending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mensagens Enviadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotificacoes.map((notificacao) => (
                      <TableRow key={notificacao.id}>
                        <TableCell>{notificacao.data}</TableCell>
                        <TableCell className="font-medium">{notificacao.empresa}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCanalIcon(notificacao.canal)}
                            {notificacao.canal}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{notificacao.mensagem}</TableCell>
                        <TableCell>{getStatusBadge(notificacao.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination page={notifPage} pageSize={notifPageSize} total={notificacoes.length} onPageChange={setNotifPage} onPageSizeChange={(size) => { setNotifPageSize(size); setNotifPage(1); }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Contato por Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Filtrar empresa..."
                  value={empresaFiltroObs}
                  onChange={(e) => setEmpresaFiltroObs(e.target.value)}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Observações (Histórico)</TableHead>
                      <TableHead>Nova observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedObs.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.razao_social}</TableCell>
                        <TableCell className="whitespace-pre-wrap text-sm">{empresa.observacoes || "-"}</TableCell>
                        <TableCell className="space-y-2 min-w-[280px]">
                          <Textarea
                            value={novaObservacaoByEmpresa[empresa.id] ?? ""}
                            onChange={(e) => setNovaObservacaoByEmpresa((prev) => ({ ...prev, [empresa.id]: e.target.value }))}
                            placeholder="Adicionar nova entrada no histórico..."
                            rows={3}
                          />
                          <Button size="sm" onClick={() => handleAdicionarObservacao(empresa.id, empresa.observacoes)}>
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination page={obsPage} pageSize={obsPageSize} total={empresasFiltradasObs.length} onPageChange={setObsPage} onPageSizeChange={(size) => { setObsPageSize(size); setObsPage(1); }} />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Comunicacao;
