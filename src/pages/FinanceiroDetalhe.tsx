import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mockBoletos = [
  {
    id: 1,
    empresa: "Estilo Nordeste",
    valor: 450,
    vencimento: "10/03/2025",
    status: "Pago",
    pagamento: "09/03/2025",
    historico: [
      { data: "09/03/2025", evento: "Pagamento confirmado" },
      { data: "05/03/2025", evento: "Boleto enviado por e-mail" },
      { data: "01/03/2025", evento: "Boleto gerado" },
    ],
  },
  {
    id: 2,
    empresa: "Costura Viva",
    valor: 450,
    vencimento: "15/03/2025",
    status: "Atrasado",
    pagamento: null,
    historico: [
      { data: "16/03/2025", evento: "Notificação de atraso enviada" },
      { data: "10/03/2025", evento: "Boleto enviado por e-mail" },
      { data: "05/03/2025", evento: "Boleto gerado" },
    ],
  },
];

const FinanceiroDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const boleto = mockBoletos.find((b) => b.id === Number(id));

  if (!boleto) {
    return <div>Boleto não encontrado</div>;
  }

  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "O boleto será baixado em breve",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard/financeiro")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold">Detalhes do Pagamento</h1>
              <Badge variant={boleto.status === "Pago" ? "default" : "destructive"}>
                {boleto.status}
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Boleto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium text-lg">{boleto.empresa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-bold text-2xl text-accent">
                      R$ {boleto.valor.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vencimento</p>
                      <p className="font-medium">{boleto.vencimento}</p>
                    </div>
                    {boleto.pagamento && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                        <p className="font-medium">{boleto.pagamento}</p>
                      </div>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Boleto
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {boleto.historico.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 border-l-2 border-accent pl-4 pb-4"
                      >
                        <div>
                          <p className="text-sm text-muted-foreground">{item.data}</p>
                          <p className="font-medium">{item.evento}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FinanceiroDetalhe;
