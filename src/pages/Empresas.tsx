import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Edit, Trash2, Plus, Upload, Download, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Colaborador = {
  nome: string;
  cpf: string;
  telefone: string;
  cargo: string;
  email: string;
  observacoes?: string;
};

type Empresa = {
  id: string;
  logoUrl: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  situacao: "Associada" | "Não associada" | "Inadimplente";
  ultimaAtualizacao: string;
  colaboradores: Colaborador[];
};

const mockEmpresas: Empresa[] = [
  {
    id: "e1",
    logoUrl: "",
    razaoSocial: "Estilo Nordeste Ltda",
    nomeFantasia: "Estilo Nordeste",
    cnpj: "11.222.333/0001-44",
    email: "contato@estilonordeste.com",
    telefone: "(85) 3333-4444",
    endereco: "Rua das Flores, 123, Centro, Fortaleza/CE",
    situacao: "Associada",
    ultimaAtualizacao: "2025-11-02",
    colaboradores: [
      { nome: "João Silva", cpf: "123.456.789-00", telefone: "(85) 99999-0000", cargo: "Compras", email: "joao@estilonordeste.com" },
      { nome: "Maria Souza", cpf: "987.654.321-00", telefone: "(85) 98888-1111", cargo: "Financeiro", email: "maria@estilonordeste.com" }
    ]
  },
  {
    id: "e2",
    logoUrl: "",
    razaoSocial: "ModaSul Indústria e Comércio S.A.",
    nomeFantasia: "ModaSul",
    cnpj: "22.333.444/0001-55",
    email: "contato@modasul.com",
    telefone: "(85) 3555-6666",
    endereco: "Av. Principal, 456, Aldeota, Fortaleza/CE",
    situacao: "Não associada",
    ultimaAtualizacao: "2025-10-20",
    colaboradores: [
      { nome: "Bruno Lima", cpf: "222.333.444-55", telefone: "(85) 97777-2222", cargo: "Diretor", email: "bruno@modasul.com" }
    ]
  },
  {
    id: "e3",
    logoUrl: "",
    razaoSocial: "Confecções Aurora LTDA",
    nomeFantasia: "Aurora",
    cnpj: "12.345.678/0001-90",
    email: "contato@aurora.com",
    telefone: "(85) 3222-3333",
    endereco: "Rua do Comércio, 789, Messejana, Fortaleza/CE",
    situacao: "Inadimplente",
    ultimaAtualizacao: "2025-09-15",
    colaboradores: [
      { nome: "Ana Souza", cpf: "111.222.333-44", telefone: "(85) 96666-5555", cargo: "Gerente", email: "ana@aurora.com" }
    ]
  }
];

const Empresas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Todas" | "Associadas" | "Não associadas">("Todas");
  const [empresas] = useState<Empresa[]>(mockEmpresas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState<Partial<Empresa>>({
    colaboradores: []
  });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const { toast } = useToast();

  const filteredEmpresas = empresas.filter((empresa) => {
    // Search logic: search by company name, CNPJ, or collaborator name
    const matchesSearch =
      empresa.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.cnpj.includes(searchTerm) ||
      empresa.colaboradores.some(col => col.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = 
      filterStatus === "Todas" || 
      (filterStatus === "Associadas" && empresa.situacao === "Associada") ||
      (filterStatus === "Não associadas" && empresa.situacao === "Não associada");

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Associada":
        return "default";
      case "Não associada":
        return "secondary";
      case "Inadimplente":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleOpenDialog = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData(empresa);
      setLogoPreview(empresa.logoUrl);
    } else {
      setEditingEmpresa(null);
      setFormData({ colaboradores: [{ nome: "", cpf: "", telefone: "", cargo: "", email: "" }] });
      setLogoPreview("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmpresa(null);
    setFormData({ colaboradores: [] });
    setLogoPreview("");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDownload = () => {
    if (formData.logoUrl) {
      toast({
        title: "Download iniciado",
        description: "Logo da empresa está sendo baixada.",
      });
    }
  };

  const addColaborador = () => {
    setFormData({
      ...formData,
      colaboradores: [
        ...(formData.colaboradores || []),
        { nome: "", cpf: "", telefone: "", cargo: "", email: "" }
      ]
    });
  };

  const removeColaborador = (index: number) => {
    const newColaboradores = [...(formData.colaboradores || [])];
    newColaboradores.splice(index, 1);
    setFormData({ ...formData, colaboradores: newColaboradores });
  };

  const updateColaborador = (index: number, field: keyof Colaborador, value: string) => {
    const newColaboradores = [...(formData.colaboradores || [])];
    newColaboradores[index] = { ...newColaboradores[index], [field]: value };
    setFormData({ ...formData, colaboradores: newColaboradores });
  };

  const handleSave = () => {
    toast({
      title: editingEmpresa ? "Empresa atualizada" : "Empresa cadastrada",
      description: "Dados salvos com sucesso.",
    });
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Empresa excluída",
      description: "Registro removido com sucesso.",
      variant: "destructive"
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary">Empresas</h1>
                <p className="text-muted-foreground">Gestão completa de empresas associadas e não associadas</p>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Empresa
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Empresas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por empresa, CNPJ ou colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(["Todas", "Associadas", "Não associadas"] as const).map((status) => (
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
                        <TableHead>Logo</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Última Atualização</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmpresas.map((empresa) => (
                        <TableRow key={empresa.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={empresa.logoUrl} />
                              <AvatarFallback>{empresa.nomeFantasia.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{empresa.razaoSocial}</div>
                            <div className="text-sm text-muted-foreground">{empresa.nomeFantasia}</div>
                          </TableCell>
                          <TableCell>{empresa.cnpj}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(empresa.situacao)}>
                              {empresa.situacao}
                            </Badge>
                          </TableCell>
                          <TableCell>{empresa.ultimaAtualizacao}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(empresa)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(empresa)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(empresa.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEmpresa ? "Editar Empresa" : "Cadastrar Empresa"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da empresa e seus colaboradores
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo da Empresa</Label>
                    <div className="flex gap-4 items-center">
                      {logoPreview && (
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={logoPreview} />
                          <AvatarFallback>Logo</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        </Button>
                        {logoPreview && (
                          <Button variant="outline" size="sm" onClick={handleLogoDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input
                        id="razaoSocial"
                        value={formData.razaoSocial || ""}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        placeholder="Digite a razão social"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input
                        id="nomeFantasia"
                        value={formData.nomeFantasia || ""}
                        onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                        placeholder="Digite o nome fantasia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj || ""}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone || ""}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Textarea
                      id="endereco"
                      value={formData.endereco || ""}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, Número, Bairro, Cidade, Estado, CEP"
                    />
                  </div>

                  {/* Colaboradores */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg">Colaboradores</Label>
                      <Button variant="outline" size="sm" onClick={addColaborador}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar colaborador
                      </Button>
                    </div>

                    {formData.colaboradores?.map((colaborador, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold">Colaborador {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColaborador(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nome</Label>
                              <Input
                                value={colaborador.nome}
                                onChange={(e) => updateColaborador(index, "nome", e.target.value)}
                                placeholder="Nome completo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CPF</Label>
                              <Input
                                value={colaborador.cpf}
                                onChange={(e) => updateColaborador(index, "cpf", e.target.value)}
                                placeholder="000.000.000-00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Telefone/WhatsApp</Label>
                              <Input
                                value={colaborador.telefone}
                                onChange={(e) => updateColaborador(index, "telefone", e.target.value)}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Cargo/Função</Label>
                              <Input
                                value={colaborador.cargo}
                                onChange={(e) => updateColaborador(index, "cargo", e.target.value)}
                                placeholder="Cargo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>E-mail</Label>
                              <Input
                                type="email"
                                value={colaborador.email}
                                onChange={(e) => updateColaborador(index, "email", e.target.value)}
                                placeholder="email@exemplo.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Observações</Label>
                              <Input
                                value={colaborador.observacoes || ""}
                                onChange={(e) => updateColaborador(index, "observacoes", e.target.value)}
                                placeholder="Observações (opcional)"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Empresas;
