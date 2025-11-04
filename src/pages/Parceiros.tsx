import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, FileText } from "lucide-react";

const mockPalestrantes = [
  { nome: "Carla Menezes", especialidade: "Compliance", cache: 2500, eventos: 8 },
  { nome: "Roberto Silva", especialidade: "Gestão de Pessoas", cache: 3000, eventos: 12 },
  { nome: "Juliana Costa", especialidade: "Sustentabilidade", cache: 2800, eventos: 6 },
];

const mockInstituicoes = [
  { nome: "SEBRAE/CE", categoria: "Fomento", status: "Ativo" },
  { nome: "FIRJAN", categoria: "Indústria", status: "Ativo" },
  { nome: "IEL - Instituto Euvaldo Lodi", categoria: "Educação", status: "Ativo" },
  { nome: "Universidade Federal do Ceará", categoria: "Educação", status: "Ativo" },
];

const mockContratos = [
  { titulo: "Acordo Cooperação SEBRAE", venceEmDias: 45, assinatura: "Pendente" },
  { titulo: "Convênio FIRJAN", venceEmDias: 120, assinatura: "Assinado" },
  { titulo: "Parceria UFC - Estágios", venceEmDias: 15, assinatura: "Pendente" },
];

const Parceiros = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary">Parceiros</h1>
              <p className="text-muted-foreground">Gestão de parceiros e instituições colaboradoras</p>
            </div>

            <Tabs defaultValue="palestrantes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="palestrantes">Palestrantes e Consultores</TabsTrigger>
                <TabsTrigger value="instituicoes">Instituições Parceiras</TabsTrigger>
                <TabsTrigger value="contratos">Termos e Contratos</TabsTrigger>
              </TabsList>

              <TabsContent value="palestrantes">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockPalestrantes.map((palestrante, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{palestrante.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{palestrante.nome}</CardTitle>
                            <p className="text-sm text-muted-foreground">{palestrante.especialidade}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cachê padrão:</span>
                            <span className="font-semibold">R$ {palestrante.cache.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Histórico de eventos:</span>
                            <span className="font-semibold">{palestrante.eventos} eventos</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instituicoes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Instituições Parceiras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Instituição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockInstituicoes.map((inst, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{inst.nome}</TableCell>
                              <TableCell>{inst.categoria}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">{inst.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contratos">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Termos e Contratos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockContratos.map((contrato, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{contrato.titulo}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={contrato.venceEmDias < 30 ? "destructive" : "secondary"}>
                                  Vence em {contrato.venceEmDias} dias
                                </Badge>
                                <Badge variant={contrato.assinatura === "Assinado" ? "default" : "outline"}>
                                  {contrato.assinatura}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default Parceiros;
