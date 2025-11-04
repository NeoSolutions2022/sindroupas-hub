import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Edit, FileText, Calculator, MessageSquare, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mockAssociados = [
  { id: 1, empresa: "Confecções Aurora", cnpj: "12.345.678/0001-90", responsavel: "Ana Souza", status: "Ativo", ultimaAtualizacao: "2025-10-18" },
  { id: 2, empresa: "ModaSul Ltda", cnpj: "23.456.789/0001-80", responsavel: "Bruno Lima", status: "Inadimplente", ultimaAtualizacao: "2025-09-07" },
  { id: 3, empresa: "Tecidos Nordeste", cnpj: "34.567.890/0001-70", responsavel: "Pedro Costa", status: "Ativo", ultimaAtualizacao: "2025-10-25" },
];

const Cadastros = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredAssociados = mockAssociados.filter((associado) => {
    const matchesSearch =
      associado.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      associado.cnpj.includes(searchTerm) ||
      associado.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "Todos" || associado.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    toast({
      title: "Mensagem enviada",
      description: "Link de atualização enviado via WhatsApp com sucesso.",
    });
  };

  const handleDownload = (type: string) => {
    toast({
      title: "Download iniciado",
      description: `${type} está sendo gerado...`,
    });
  };

  const handleUpload = () => {
    toast({
      title: "Upload realizado",
      description: "Documento enviado com sucesso.",
    });
  };

  const handleSubmit = () => {
    toast({
      title: "Cadastro salvo",
      description: "Dados do associado atualizados com sucesso.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Inadimplente":
        return "bg-red-100 text-red-800";
      case "Desligado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary">Associados</h1>
              <p className="text-muted-foreground">Gestão completa de associados do sindicato</p>
            </div>

            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
                <TabsTrigger value="lista">Lista</TabsTrigger>
                <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="contribuicao">Contribuição</TabsTrigger>
                <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
                <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
              </TabsList>

              <TabsContent value="lista">
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Associados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por empresa, CNPJ ou responsável..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        {["Todos", "Ativo", "Inadimplente", "Desligado"].map((status) => (
                          <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Atualização</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssociados.map((associado) => (
                            <TableRow key={associado.id}>
                              <TableCell className="font-medium">{associado.empresa}</TableCell>
                              <TableCell>{associado.cnpj}</TableCell>
                              <TableCell>{associado.responsavel}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(associado.status)}>{associado.status}</Badge>
                              </TableCell>
                              <TableCell>{associado.ultimaAtualizacao}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/dashboard/associados/${associado.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cadastro">
                <Card>
                  <CardHeader>
                    <CardTitle>Novo Cadastro / Atualização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="razaoSocial">Razão Social</Label>
                          <Input id="razaoSocial" placeholder="Digite a razão social" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                          <Input id="nomeFantasia" placeholder="Digite o nome fantasia" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input id="cnpj" placeholder="00.000.000/0000-00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="responsavel">Responsável</Label>
                          <Input id="responsavel" placeholder="Nome do responsável" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input id="email" type="email" placeholder="email@empresa.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp</Label>
                          <Input id="whatsapp" placeholder="(00) 00000-0000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <Textarea id="endereco" placeholder="Rua, Número, Bairro, Cidade, Estado, CEP" />
                      </div>
                      <Button onClick={handleSubmit} type="button">Salvar Cadastro</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentos">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos e Consentimentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["Cartão CNPJ", "Contrato Social", "Termo LGPD", "Logo da Empresa"].map((doc) => (
                        <div key={doc} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{doc}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleUpload}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contribuicao">
                <Card>
                  <CardHeader>
                    <CardTitle>Contribuição Assistencial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-secondary/20 rounded-lg space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Simulador de Cálculo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="base">Base de Cálculo (R$)</Label>
                            <Input id="base" type="number" placeholder="10000" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="aliquota">Alíquota (%)</Label>
                            <Input id="aliquota" type="number" placeholder="2.5" />
                          </div>
                          <div className="space-y-2">
                            <Label>Valor Estimado</Label>
                            <div className="text-2xl font-bold text-primary">R$ 250,00</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-4">Histórico de Emissões</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Out/2025</TableCell>
                              <TableCell>R$ 250,00</TableCell>
                              <TableCell><Badge>Pago</Badge></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comunicacao">
                <Card>
                  <CardHeader>
                    <CardTitle>Comunicação Direta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Nova Mensagem
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enviar Mensagem</DialogTitle>
                          <DialogDescription>
                            Envie atualizações e links para os associados
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="canal">Canal</Label>
                            <Select defaultValue="whatsapp">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">E-mail</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mensagem">Mensagem</Label>
                            <Textarea
                              id="mensagem"
                              placeholder="Olá {{empresa}}, por favor atualize seus dados..."
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="linkForms">Link do Google Forms</Label>
                            <Input id="linkForms" placeholder="https://forms.google.com/..." />
                          </div>
                          <Button onClick={handleSendMessage} className="w-full">Enviar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comprovantes">
                <Card>
                  <CardHeader>
                    <CardTitle>Comprovantes e Declarações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["Carteirinha de Associado", "Declaração de Filiação", "Recibo de Contribuição"].map((doc) => (
                        <Button key={doc} variant="outline" className="h-20" onClick={() => handleDownload(doc)}>
                          <div className="flex flex-col items-center gap-2">
                            <Download className="h-5 w-5" />
                            <span>{doc}</span>
                          </div>
                        </Button>
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

export default Cadastros;
