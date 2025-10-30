import { useState, useEffect } from "react";
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
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(mockNotificacoesInicial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaNotificacao, setNovaNotificacao] = useState({
    empresa: "",
    canal: "WhatsApp" as "WhatsApp" | "E-mail",
    mensagem: "",
    linkFormulario: "",
  });
  const { toast } = useToast();

  const handleEnviarNotificacao = () => {
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

    const novaNotif: Notificacao = {
      id: notificacoes.length + 1,
      empresa: novaNotificacao.empresa,
      canal: novaNotificacao.canal,
      mensagem: mensagemComPlaceholder,
      status: "enviado",
      data: new Date().toISOString().split("T")[0],
    };

    setNotificacoes([novaNotif, ...notificacoes]);

    // Simular mudança de status após 3s
    setTimeout(() => {
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === novaNotif.id ? { ...n, status: "entregue" } : n))
      );
    }, 3000);

    toast({
      title: "Notificação enviada",
      description: `Mensagem enviada para ${novaNotificacao.empresa} via ${novaNotificacao.canal}`,
    });

    setNovaNotificacao({ empresa: "", canal: "WhatsApp", mensagem: "", linkFormulario: "" });
    setDialogOpen(false);
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
                      <Input
                        id="empresa"
                        placeholder="Nome da empresa"
                        value={novaNotificacao.empresa}
                        onChange={(e) =>
                          setNovaNotificacao({ ...novaNotificacao, empresa: e.target.value })
                        }
                      />
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
                    <Button onClick={handleEnviarNotificacao}>Enviar</Button>
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
                    {notificacoes.map((notificacao) => (
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
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Comunicacao;
