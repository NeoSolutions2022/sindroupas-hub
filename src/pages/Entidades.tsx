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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Edit, Trash2, Plus, Upload, Download, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

type TipoEntidade = "empresa" | "parceiro" | "fornecedor" | "mantenedor";

type Colaborador = {
  nome: string;
  cpf: string;
  whatsapp: string;
  cargo: string;
  email: string;
  observacoes?: string;
};

type Responsavel = {
  nome: string;
  whatsapp: string;
};

type Entidade = {
  id: string;
  tipo: TipoEntidade;
  nome: string;
  logoUrl?: string;
  cnpj?: string;
  // Empresa-specific
  associado?: boolean;
  situacaoFinanceira?: "Regular" | "Inadimplente";
  porte?: "ME" | "MEI" | "EPP" | "Pequena" | "Média" | "Grande";
  capitalSocial?: number;
  faixaId?: string;
  faixaLabel?: string;
  dataFundacao?: string;
  dataAssociacao?: string;
  dataDesassociacao?: string;
  responsavel?: Responsavel;
  colaboradores?: Colaborador[];
  // Parceiro-specific
  categoria?: string;
  status?: "Ativo" | "Encerrado" | "Pendente";
  descricao?: string;
  // Fornecedor-specific
  ultimoPagamento?: string;
  // Mantenedor-specific
  aporteTotal?: number;
  contrapartidas?: string;
};

const mockEntidades: Entidade[] = [
  {
    id: "e1",
    tipo: "empresa",
    nome: "Estilo Nordeste Ltda",
    cnpj: "11.222.333/0001-44",
    logoUrl: "",
    associado: true,
    situacaoFinanceira: "Regular",
    porte: "ME",
    capitalSocial: 200000,
    faixaId: "f1",
    faixaLabel: "1–20 • R$600",
    dataFundacao: "2015-03-10",
    dataAssociacao: "2020-06-01",
    colaboradores: [
      { nome: "João Silva", cpf: "123.456.789-00", whatsapp: "(85) 99999-0000", cargo: "Compras", email: "joao@estilonordeste.com" }
    ]
  },
  {
    id: "p1",
    tipo: "parceiro",
    nome: "SEBRAE/CE",
    categoria: "Fomento",
    status: "Ativo"
  },
  {
    id: "f1",
    tipo: "fornecedor",
    nome: "Gráfica Verde",
    categoria: "Papelaria",
    status: "Ativo",
    ultimoPagamento: "2025-10-02"
  },
  {
    id: "m1",
    tipo: "mantenedor",
    nome: "Têxtil Nordeste S/A",
    cnpj: "11.222.333/0001-44",
    status: "Ativo",
    aporteTotal: 50000,
    contrapartidas: "Logo em eventos, menção em materiais"
  }
];

const Entidades = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoEntidade[]>([]);
  const [filterAssociado, setFilterAssociado] = useState<"todos" | "sim" | "nao">("todos");
  const [filterSituacaoFinanceira, setFilterSituacaoFinanceira] = useState<"todos" | "Regular" | "Inadimplente">("todos");
  const [filterPorte, setFilterPorte] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  
  const [entidades] = useState<Entidade[]>(mockEntidades);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null);
  const [formData, setFormData] = useState<Partial<Entidade>>({ tipo: "empresa", colaboradores: [] });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredEntidades = entidades.filter((ent) => {
    // Search logic
    const matchesSearch =
      ent.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ent.cnpj && ent.cnpj.includes(searchTerm)) ||
      (ent.colaboradores && ent.colaboradores.some(col => col.nome.toLowerCase().includes(searchTerm.toLowerCase())));

    // Tipo filter
    const matchesTipo = filterTipo.length === 0 || filterTipo.includes(ent.tipo);

    // Empresa-specific filters
    const matchesAssociado = 
      ent.tipo !== "empresa" || 
      filterAssociado === "todos" || 
      (filterAssociado === "sim" && ent.associado) ||
      (filterAssociado === "nao" && !ent.associado);

    const matchesSituacao = 
      ent.tipo !== "empresa" || 
      filterSituacaoFinanceira === "todos" || 
      ent.situacaoFinanceira === filterSituacaoFinanceira;

    const matchesPorte = 
      ent.tipo !== "empresa" || 
      filterPorte === "todos" || 
      ent.porte === filterPorte;

    // Parceiro/Fornecedor categoria filter
    const matchesCategoria = 
      (ent.tipo !== "parceiro" && ent.tipo !== "fornecedor") || 
      filterCategoria === "todos" || 
      ent.categoria === filterCategoria;

    // Status filter
    const matchesStatus = 
      filterStatus === "todos" || 
      ent.status === filterStatus;

    return matchesSearch && matchesTipo && matchesAssociado && matchesSituacao && matchesPorte && matchesCategoria && matchesStatus;
  });

  const toggleTipoFilter = (tipo: TipoEntidade) => {
    setFilterTipo(prev => 
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const getTipoBadgeColor = (tipo: TipoEntidade) => {
    switch (tipo) {
      case "empresa": return "default";
      case "parceiro": return "secondary";
      case "fornecedor": return "outline";
      case "mantenedor": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Ativo":
      case "Regular":
        return "default";
      case "Inadimplente":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleOpenDialog = (entidade?: Entidade) => {
    if (entidade) {
      setEditingEntidade(entidade);
      setFormData(entidade);
      setLogoPreview(entidade.logoUrl || "");
    } else {
      setEditingEntidade(null);
      setFormData({ tipo: "empresa", colaboradores: [{ nome: "", cpf: "", whatsapp: "", cargo: "", email: "" }] });
      setLogoPreview("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntidade(null);
    setFormData({ tipo: "empresa", colaboradores: [] });
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
        description: "Logo está sendo baixada.",
      });
    }
  };

  const addColaborador = () => {
    setFormData({
      ...formData,
      colaboradores: [
        ...(formData.colaboradores || []),
        { nome: "", cpf: "", whatsapp: "", cargo: "", email: "" }
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
      title: editingEntidade ? "Entidade atualizada" : "Entidade cadastrada",
      description: "Dados salvos com sucesso.",
    });
    handleCloseDialog();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    toast({
      title: "Entidade excluída",
      description: "Registro removido com sucesso.",
      variant: "destructive"
    });
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const getResponsavelDisplay = (ent: Entidade) => {
    if (ent.responsavel && ent.responsavel.whatsapp) {
      return `${ent.responsavel.nome} • ${ent.responsavel.whatsapp}`;
    }
    if (ent.colaboradores && ent.colaboradores.length > 0) {
      const primeiro = ent.colaboradores[0];
      return `${primeiro.nome} • ${primeiro.whatsapp}`;
    }
    return "-";
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
                <h1 className="text-3xl font-bold text-primary">Entidades</h1>
                <p className="text-muted-foreground">Gestão unificada de empresas, parceiros, fornecedores e mantenedores</p>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Entidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 mb-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CNPJ ou colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Tipo Filter */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-muted-foreground self-center">Tipo:</span>
                    {(["empresa", "parceiro", "fornecedor", "mantenedor"] as const).map((tipo) => (
                      <Badge
                        key={tipo}
                        variant={filterTipo.includes(tipo) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTipoFilter(tipo)}
                      >
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  {/* Conditional Filters */}
                  {(filterTipo.length === 0 || filterTipo.includes("empresa")) && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-medium text-muted-foreground">Empresa:</span>
                      <Select value={filterAssociado} onValueChange={(v: any) => setFilterAssociado(v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="sim">Associado</SelectItem>
                          <SelectItem value="nao">Não associado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterSituacaoFinanceira} onValueChange={(v: any) => setFilterSituacaoFinanceira(v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas Situações</SelectItem>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPorte} onValueChange={setFilterPorte}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos Portes</SelectItem>
                          <SelectItem value="ME">ME</SelectItem>
                          <SelectItem value="MEI">MEI</SelectItem>
                          <SelectItem value="EPP">EPP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(filterTipo.length === 0 || filterTipo.includes("parceiro") || filterTipo.includes("fornecedor")) && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
                      <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas</SelectItem>
                          <SelectItem value="Fomento">Fomento</SelectItem>
                          <SelectItem value="Papelaria">Papelaria</SelectItem>
                          <SelectItem value="Audiovisual">Audiovisual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Encerrado">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Logo</TableHead>
                        <TableHead>Nome/Razão Social</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Associado</TableHead>
                        <TableHead>Situação Financeira</TableHead>
                        <TableHead>Porte</TableHead>
                        <TableHead>Capital Social</TableHead>
                        <TableHead>Faixa</TableHead>
                        <TableHead>Data Fundação</TableHead>
                        <TableHead>Data Associação</TableHead>
                        <TableHead>Data Desassociação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntidades.map((ent) => (
                        <TableRow key={ent.id}>
                          <TableCell>
                            <Badge variant={getTipoBadgeColor(ent.tipo)}>
                              {ent.tipo.charAt(0).toUpperCase() + ent.tipo.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ent.logoUrl} />
                              <AvatarFallback>{ent.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{ent.nome}</TableCell>
                          <TableCell>{ent.cnpj || "-"}</TableCell>
                          <TableCell>
                            {ent.tipo === "empresa" ? (
                              <Badge variant={ent.associado ? "default" : "secondary"}>
                                {ent.associado ? "Sim" : "Não"}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {ent.tipo === "empresa" && ent.situacaoFinanceira ? (
                              <Badge variant={getStatusColor(ent.situacaoFinanceira)}>
                                {ent.situacaoFinanceira}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{ent.tipo === "empresa" ? (ent.porte || "-") : "-"}</TableCell>
                          <TableCell>
                            {ent.tipo === "empresa" && ent.capitalSocial ? 
                              `R$ ${ent.capitalSocial.toLocaleString('pt-BR')}` : "-"}
                          </TableCell>
                          <TableCell>{ent.tipo === "empresa" ? (ent.faixaLabel || "-") : "-"}</TableCell>
                          <TableCell>{ent.tipo === "empresa" ? (ent.dataFundacao || "-") : "-"}</TableCell>
                          <TableCell>{ent.tipo === "empresa" ? (ent.dataAssociacao || "-") : "-"}</TableCell>
                          <TableCell>{ent.tipo === "empresa" ? (ent.dataDesassociacao || "-") : "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(ent)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(ent)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(ent.id)}>
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
                  <DialogTitle>{editingEntidade ? "Editar Entidade" : "Criar Entidade"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados conforme o tipo de entidade
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Tipo Selection */}
                  {!editingEntidade && (
                    <div className="space-y-2">
                      <Label>Tipo de Entidade</Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(v: TipoEntidade) => setFormData({ ...formData, tipo: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empresa">Empresa</SelectItem>
                          <SelectItem value="parceiro">Parceiro</SelectItem>
                          <SelectItem value="fornecedor">Fornecedor</SelectItem>
                          <SelectItem value="mantenedor">Mantenedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome/Razão Social</Label>
                      <Input
                        value={formData.nome || ""}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome da entidade"
                      />
                    </div>
                    {(formData.tipo === "empresa" || formData.tipo === "mantenedor") && (
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input
                          value={formData.cnpj || ""}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                    )}
                  </div>

                  {/* Logo Upload (Empresa) */}
                  {formData.tipo === "empresa" && (
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
                  )}

                  {/* Empresa-specific fields */}
                  {formData.tipo === "empresa" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Associado</Label>
                          <Select 
                            value={formData.associado ? "sim" : "nao"}
                            onValueChange={(v) => setFormData({ ...formData, associado: v === "sim" })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Situação Financeira</Label>
                          <Select 
                            value={formData.situacaoFinanceira}
                            onValueChange={(v: "Regular" | "Inadimplente") => setFormData({ ...formData, situacaoFinanceira: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Porte</Label>
                          <Select 
                            value={formData.porte}
                            onValueChange={(v: any) => setFormData({ ...formData, porte: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ME">ME</SelectItem>
                              <SelectItem value="MEI">MEI</SelectItem>
                              <SelectItem value="EPP">EPP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Capital Social (R$)</Label>
                          <Input
                            type="number"
                            value={formData.capitalSocial || ""}
                            onChange={(e) => setFormData({ ...formData, capitalSocial: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Data Fundação</Label>
                          <Input
                            type="date"
                            value={formData.dataFundacao || ""}
                            onChange={(e) => setFormData({ ...formData, dataFundacao: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Associação</Label>
                          <Input
                            type="date"
                            value={formData.dataAssociacao || ""}
                            onChange={(e) => setFormData({ ...formData, dataAssociacao: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Desassociação</Label>
                          <Input
                            type="date"
                            value={formData.dataDesassociacao || ""}
                            onChange={(e) => setFormData({ ...formData, dataDesassociacao: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Faixa (somente visualização)</Label>
                        <Input
                          value={formData.faixaLabel || "Configurado no Financeiro"}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Responsável (opcional)</Label>
                          <Input
                            value={formData.responsavel?.nome || ""}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              responsavel: { ...formData.responsavel, nome: e.target.value, whatsapp: formData.responsavel?.whatsapp || "" } 
                            })}
                            placeholder="Nome do responsável"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>WhatsApp do Responsável</Label>
                          <Input
                            value={formData.responsavel?.whatsapp || ""}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              responsavel: { nome: formData.responsavel?.nome || "", whatsapp: e.target.value } 
                            })}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
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

                        {formData.colaboradores?.map((col, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold">Colaborador {index + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => removeColaborador(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nome</Label>
                                  <Input
                                    value={col.nome}
                                    onChange={(e) => updateColaborador(index, "nome", e.target.value)}
                                    placeholder="Nome completo"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>CPF</Label>
                                  <Input
                                    value={col.cpf}
                                    onChange={(e) => updateColaborador(index, "cpf", e.target.value)}
                                    placeholder="000.000.000-00"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>WhatsApp</Label>
                                  <Input
                                    value={col.whatsapp}
                                    onChange={(e) => updateColaborador(index, "whatsapp", e.target.value)}
                                    placeholder="(00) 00000-0000"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Cargo/Função</Label>
                                  <Input
                                    value={col.cargo}
                                    onChange={(e) => updateColaborador(index, "cargo", e.target.value)}
                                    placeholder="Ex: Gerente"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>E-mail</Label>
                                  <Input
                                    type="email"
                                    value={col.email}
                                    onChange={(e) => updateColaborador(index, "email", e.target.value)}
                                    placeholder="email@empresa.com"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Observações</Label>
                                  <Input
                                    value={col.observacoes || ""}
                                    onChange={(e) => updateColaborador(index, "observacoes", e.target.value)}
                                    placeholder="Observações adicionais"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Parceiro fields */}
                  {formData.tipo === "parceiro" && (
                    <>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Input
                          value={formData.categoria || ""}
                          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                          placeholder="Ex: Fomento, Educação"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={formData.descricao || ""}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descrição do parceiro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={formData.status}
                          onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Encerrado">Encerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Fornecedor fields */}
                  {formData.tipo === "fornecedor" && (
                    <>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Input
                          value={formData.categoria || ""}
                          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                          placeholder="Ex: Papelaria, Audiovisual"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={formData.status}
                          onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Último Pagamento</Label>
                        <Input
                          type="date"
                          value={formData.ultimoPagamento || ""}
                          onChange={(e) => setFormData({ ...formData, ultimoPagamento: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* Mantenedor fields */}
                  {formData.tipo === "mantenedor" && (
                    <>
                      <div className="space-y-2">
                        <Label>Aporte Total (R$)</Label>
                        <Input
                          type="number"
                          value={formData.aporteTotal || ""}
                          onChange={(e) => setFormData({ ...formData, aporteTotal: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contrapartidas</Label>
                        <Textarea
                          value={formData.contrapartidas || ""}
                          onChange={(e) => setFormData({ ...formData, contrapartidas: e.target.value })}
                          placeholder="Descreva as contrapartidas acordadas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={formData.status}
                          onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Encerrado">Encerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onConfirm={handleDeleteConfirm}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Entidades;
