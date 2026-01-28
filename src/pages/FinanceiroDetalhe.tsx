import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { hasuraRequest } from "@/lib/api";
import { format } from "date-fns";

type BoletoDetalhe = {
  id: string;
  empresa: string;
  valor: number;
  vencimento: string;
  status: string;
  pagamento?: string | null;
  pdfUrl?: string | null;
  historico: { data: string; evento: string }[];
};

type BoletoDetalheResponse = {
  data?: {
    financeiro_boletos_by_pk?: {
      id: string;
      valor?: number | null;
      vencimento?: string | null;
      status?: string | null;
      pdf_url?: string | null;
      empresa?: { nome_fantasia?: string | null; razao_social?: string | null } | null;
      updated_at?: string | null;
    } | null;
  };
  errors?: { message: string }[];
};

const FinanceiroDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [boleto, setBoleto] = useState<BoletoDetalhe | null>(null);

  const fallbackHistorico = useMemo(
    () => [
      { data: "—", evento: "Boleto gerado" },
      { data: "—", evento: "Boleto enviado por e-mail" },
      { data: "—", evento: "Aguardando pagamento" },
    ],
    [],
  );

  useEffect(() => {
    const loadBoleto = async () => {
      if (!id) return;
      try {
        const response = await hasuraRequest<BoletoDetalheResponse>(
          `
          query BoletoDetalhe($id: uuid!) {
            financeiro_boletos_by_pk(id: $id) {
              id
              valor
              vencimento
              status
              pdf_url
              updated_at
              empresa {
                nome_fantasia
                razao_social
              }
            }
          }
        `,
          { id },
        );

        if (response.errors?.length) {
          throw new Error(response.errors[0]?.message);
        }

        const data = response.data?.financeiro_boletos_by_pk;
        if (!data) {
          setBoleto(null);
          return;
        }

        const status = (data.status || "").toLowerCase();
        const statusLabel =
          status === "pago"
            ? "Pago"
            : status === "atrasado"
              ? "Atrasado"
              : status === "cancelado"
                ? "Cancelado"
                : "Pendente";
        const updatedAt = data.updated_at ? format(new Date(data.updated_at), "dd/MM/yyyy") : "—";

        setBoleto({
          id: data.id,
          empresa: data.empresa?.nome_fantasia || data.empresa?.razao_social || "Empresa",
          valor: data.valor ?? 0,
          vencimento: data.vencimento ? format(new Date(data.vencimento), "dd/MM/yyyy") : "—",
          status: statusLabel,
          pagamento: status === "pago" ? updatedAt : null,
          pdfUrl: data.pdf_url ?? null,
          historico:
            status === "pago"
              ? [
                  { data: updatedAt, evento: "Pagamento confirmado" },
                  { data: "—", evento: "Boleto enviado por e-mail" },
                  { data: "—", evento: "Boleto gerado" },
                ]
              : fallbackHistorico,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar boleto.";
        toast({
          title: "Erro ao carregar boleto",
          description: message,
          variant: "destructive",
        });
      }
    };

    loadBoleto();
  }, [fallbackHistorico, id, toast]);

  if (!boleto) {
    return <div>Boleto não encontrado</div>;
  }

  const handleDownload = () => {
    if (boleto.pdfUrl) {
      window.open(boleto.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
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
