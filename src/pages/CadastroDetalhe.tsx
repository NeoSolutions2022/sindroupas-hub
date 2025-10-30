import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const mockAssociados = [
  { 
    id: 1, 
    empresa: "Confecções Aurora", 
    cnpj: "12.345.678/0001-90", 
    responsavel: "Maria Silva", 
    email: "maria@aurora.com.br",
    telefone: "(11) 98765-4321",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "Ativo",
    historico: [
      { data: "15/03/2025", evento: "Pagamento realizado" },
      { data: "10/02/2025", evento: "Dados atualizados" },
      { data: "05/01/2025", evento: "Cadastro criado" },
    ]
  },
  { 
    id: 2, 
    empresa: "ModaSul Ltda", 
    cnpj: "23.456.789/0001-80", 
    responsavel: "João Santos", 
    email: "joao@modasul.com.br",
    telefone: "(21) 99876-5432",
    endereco: "Av. Central, 456 - Rio de Janeiro, RJ",
    status: "Inadimplente",
    historico: [
      { data: "01/03/2025", evento: "Pagamento pendente" },
      { data: "15/02/2025", evento: "Notificação enviada" },
    ]
  },
];

const CadastroDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const associado = mockAssociados.find((a) => a.id === Number(id));

  if (!associado) {
    return <div>Associado não encontrado</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      Ativo: "default",
      Inadimplente: "destructive",
      "Não atualizado": "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard/cadastros")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold">{associado.empresa}</h1>
              {getStatusBadge(associado.status)}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{associado.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="font-medium">{associado.responsavel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{associado.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{associado.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{associado.endereco}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Atividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {associado.historico.map((item, index) => (
                      <div key={index} className="flex gap-4 border-l-2 border-accent pl-4">
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

export default CadastroDetalhe;
