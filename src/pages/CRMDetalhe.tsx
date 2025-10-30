import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Phone, Mail, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const mockEmpresas = [
  {
    id: 1,
    nome: "Estilo Nordeste",
    engajamento: 82,
    contato: "(85) 99999-1111",
    email: "contato@estilonordeste.com.br",
    timeline: [
      { data: "20/03/2025", evento: "Reunião sobre novos benefícios", tipo: "reunião" },
      { data: "15/03/2025", evento: "Ligação de acompanhamento", tipo: "ligação" },
      { data: "10/03/2025", evento: "E-mail enviado", tipo: "email" },
    ],
    beneficios: [
      { nome: "Parceria Unifor", status: "ativo", validade: "31/12/2025" },
      { nome: "Convênio Sebrae", status: "ativo", validade: "30/06/2025" },
      { nome: "Desconto Insumos 2024", status: "expirado", validade: "31/12/2024" },
    ],
    notas: "Empresa muito engajada, interessada em novos cursos de capacitação.",
  },
  {
    id: 2,
    nome: "Costura Viva",
    engajamento: 67,
    contato: "(85) 98888-2222",
    email: "costuraviva@email.com.br",
    timeline: [
      { data: "18/03/2025", evento: "Participou do curso online", tipo: "evento" },
      { data: "01/03/2025", evento: "E-mail de boas-vindas", tipo: "email" },
    ],
    beneficios: [
      { nome: "Curso de Moda Sustentável", status: "ativo", validade: "15/05/2025" },
    ],
    notas: "Empresa nova no sindicato, demonstrou interesse em mais parcerias.",
  },
];

const CRMDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const empresa = mockEmpresas.find((e) => e.id === Number(id));
  const [notas, setNotas] = useState(empresa?.notas || "");

  if (!empresa) {
    return <div>Empresa não encontrada</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard/crm")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold">{empresa.nome}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Engajamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent">{empresa.engajamento}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Telefone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <p className="font-medium">{empresa.contato}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">E-mail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <p className="font-medium text-sm">{empresa.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {empresa.timeline.map((item, index) => (
                        <div
                          key={index}
                          className="flex gap-4 border-l-2 border-accent pl-4 pb-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">{item.data}</p>
                            </div>
                            <p className="font-medium">{item.evento}</p>
                            <Badge variant="outline" className="mt-1">
                              {item.tipo}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="beneficios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Benefícios da Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {empresa.beneficios.map((beneficio, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {beneficio.status === "ativo" ? (
                              <CheckCircle2 className="h-5 w-5 text-accent" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{beneficio.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                Validade: {beneficio.validade}
                              </p>
                            </div>
                          </div>
                          <Badge variant={beneficio.status === "ativo" ? "default" : "secondary"}>
                            {beneficio.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notas e Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Adicione observações sobre a empresa..."
                      rows={6}
                    />
                    <Button>Salvar Notas</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CRMDetalhe;
