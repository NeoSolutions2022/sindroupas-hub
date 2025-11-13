import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type TipoRelacionamento = "Parceiro" | "Mantenedor" | "Fornecedor";
type StatusParceiro = "Ativo" | "Em avaliação" | "Encerrado";
type StatusMantenedor = "Ativo" | "Encerrado";
type StatusFornecedor = "Ativo" | "Em análise" | "Recusado";

interface Relacionamento {
  id: string;
  tipo: TipoRelacionamento;
  nome: string;
  cnpj?: string;
  categoria?: string;
  status: StatusParceiro | StatusMantenedor | StatusFornecedor;
  ultimaMov?: string;
  contatos?: { email?: string; whatsapp?: string };
  descricao?: string;
  aportes?: { valor: number; data: string }[];
  contrapartidas?: string;
  observacoes?: string;
  ultimoPagamento?: { data: string; valor: number };
}

const mockRelacionamentos: Relacionamento[] = [
  {
    id: "p1",
    tipo: "Parceiro",
    nome: "SEBRAE/CE",
    categoria: "Fomento",
    status: "Ativo",
    ultimaMov: "2025-10-21 • Termo de cooperação",
    contatos: { email: "contato@sebrae.ce.gov.br", whatsapp: "(85) 3421-0000" },
    descricao: "Parceria para desenvolvimento empresarial",
  },
  {
    id: "p2",
    tipo: "Parceiro",
    nome: "FIRJAN",
    categoria: "Associação",
    status: "Ativo",
    ultimaMov: "2025-09-15 • Workshop conjunto",
    contatos: { email: "firjan@firjan.org.br" },
  },
  {
    id: "m1",
    tipo: "Mantenedor",
    nome: "Têxtil Nordeste S/A",
    cnpj: "11.222.333/0001-44",
    status: "Ativo",
    ultimaMov: "Aporte R$ 50.000 em 2025-09-12",
    contatos: { email: "contato@textilnordeste.com.br", whatsapp: "(85) 99999-8888" },
    aportes: [
      { valor: 50000, data: "2025-09-12" },
      { valor: 30000, data: "2025-03-15" },
    ],
    contrapartidas: "Logo em eventos, menção em materiais de divulgação",
  },
  {
    id: "f1",
    tipo: "Fornecedor",
    nome: "Gráfica Verde",
    cnpj: "22.333.444/0001-55",
    categoria: "Papelaria",
    status: "Ativo",
    ultimaMov: "Pagamento R$ 2.100 em 2025-10-02",
    contatos: { email: "comercial@graficaverde.com", whatsapp: "(85) 98765-4321" },
    ultimoPagamento: { data: "2025-10-02", valor: 2100 },
  },
  {
    id: "f2",
    tipo: "Fornecedor",
    nome: "TechAudio Eventos",
    cnpj: "33.444.555/0001-66",
    categoria: "Audiovisual",
    status: "Ativo",
    ultimaMov: "Pagamento R$ 5.800 em 2025-10-15",
    contatos: { email: "eventos@techaudio.com.br" },
    ultimoPagamento: { data: "2025-10-15", valor: 5800 },
  },
];

const categoriasParceiro = ["Universidade", "IEL", "FIRJAN", "SEBRAE", "Associação", "Fomento"];
const categoriasFornecedor = ["Estrutura", "Papelaria", "Brindes", "Audiovisual"];

export default function Relacionamentos() {
  const { toast } = useToast();
  const [relacionamentos, setRelacionamentos] = useState<Relacionamento[]>(mockRelacionamentos);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoRelacionamento[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formTipo, setFormTipo] = useState<TipoRelacionamento>("Parceiro");
  const [formNome, setFormNome] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formContrapartidas, setFormContrapartidas] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");

  const filteredRelacionamentos = relacionamentos.filter((r) => {
    const matchSearch =
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cnpj?.includes(searchTerm) ||
      false;
    const matchTipo = tipoFilter.length === 0 || tipoFilter.includes(r.tipo);
    const matchCategoria = !categoriaFilter || categoriaFilter === "all" || r.categoria === categoriaFilter;
    const matchStatus = !statusFilter || statusFilter === "all" || r.status === statusFilter;

    return matchSearch && matchTipo && matchCategoria && matchStatus;
  });

  const handleTipoFilterToggle = (tipo: TipoRelacionamento) => {
    setTipoFilter((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const resetForm = () => {
    setFormTipo("Parceiro");
    setFormNome("");
    setFormCnpj("");
    setFormCategoria("");
    setFormStatus("");
    setFormEmail("");
    setFormWhatsapp("");
    setFormDescricao("");
    setFormContrapartidas("");
    setFormObservacoes("");
  };

  const handleCreate = () => {
    const newRelacionamento: Relacionamento = {
      id: `new-${Date.now()}`,
      tipo: formTipo,
      nome: formNome,
      cnpj: formCnpj || undefined,
      categoria: formCategoria || undefined,
      status: formStatus as any,
      contatos: { email: formEmail, whatsapp: formWhatsapp },
      descricao: formDescricao || undefined,
      contrapartidas: formContrapartidas || undefined,
      observacoes: formObservacoes || undefined,
    };

    setRelacionamentos([...relacionamentos, newRelacionamento]);
    setIsCreateModalOpen(false);
    resetForm();
    toast({
      title: "Relacionamento criado",
      description: `${formTipo} "${formNome}" foi adicionado com sucesso.`,
    });
  };

  const handleDelete = () => {
    if (selectedId) {
      const deleted = relacionamentos.find((r) => r.id === selectedId);
      setRelacionamentos(relacionamentos.filter((r) => r.id !== selectedId));
      setIsDeleteDialogOpen(false);
      setSelectedId(null);
      toast({
        title: "Relacionamento excluído",
        description: `${deleted?.tipo} "${deleted?.nome}" foi removido.`,
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedId(id);
    setIsDeleteDialogOpen(true);
  };

  const getTipoBadgeVariant = (tipo: TipoRelacionamento) => {
    switch (tipo) {
      case "Parceiro":
        return "default";
      case "Mantenedor":
        return "secondary";
      case "Fornecedor":
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Ativo") return "default";
    if (status === "Encerrado" || status === "Recusado") return "destructive";
    return "secondary";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground">Relacionamentos</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Criar
                </Button>
              </div>

              {/* Search & Filters */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, razão social ou CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Label className="text-sm font-medium w-full">Tipo:</Label>
                    {(["Parceiro", "Mantenedor", "Fornecedor"] as TipoRelacionamento[]).map(
                      (tipo) => (
                        <div key={tipo} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tipo-${tipo}`}
                            checked={tipoFilter.includes(tipo)}
                            onCheckedChange={() => handleTipoFilterToggle(tipo)}
                          />
                          <label
                            htmlFor={`tipo-${tipo}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {tipo}
                          </label>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoria-filter">Categoria</Label>
                      <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                        <SelectTrigger id="categoria-filter">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {[...categoriasParceiro, ...categoriasFornecedor].map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status-filter">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Em avaliação">Em avaliação</SelectItem>
                          <SelectItem value="Em análise">Em análise</SelectItem>
                          <SelectItem value="Encerrado">Encerrado</SelectItem>
                          <SelectItem value="Recusado">Recusado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Table */}
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nome/Razão</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Movimentação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRelacionamentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Nenhum relacionamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRelacionamentos.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <Badge variant={getTipoBadgeVariant(r.tipo)}>{r.tipo}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{r.nome}</TableCell>
                            <TableCell>{r.cnpj || "—"}</TableCell>
                            <TableCell>{r.categoria || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(r.status)}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.ultimaMov || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(r.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Relacionamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo parceiro, mantenedor ou fornecedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo */}
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoRelacionamento)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parceiro">Parceiro</SelectItem>
                  <SelectItem value="Mantenedor">Mantenedor</SelectItem>
                  <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome/Razão Social *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome ou razão social"
              />
            </div>

            {/* CNPJ */}
            <div>
              <Label htmlFor="cnpj">CNPJ {formTipo === "Fornecedor" && "*"}</Label>
              <Input
                id="cnpj"
                value={formCnpj}
                onChange={(e) => setFormCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            {/* Categoria (Parceiro/Fornecedor) */}
            {(formTipo === "Parceiro" || formTipo === "Fornecedor") && (
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formTipo === "Parceiro" ? categoriasParceiro : categoriasFornecedor).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {formTipo === "Parceiro" && (
                    <>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em avaliação">Em avaliação</SelectItem>
                      <SelectItem value="Encerrado">Encerrado</SelectItem>
                    </>
                  )}
                  {formTipo === "Mantenedor" && (
                    <>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Encerrado">Encerrado</SelectItem>
                    </>
                  )}
                  {formTipo === "Fornecedor" && (
                    <>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Recusado">Recusado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contato@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="(85) 99999-9999"
                />
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {formTipo === "Parceiro" && (
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Descreva a parceria..."
                  rows={3}
                />
              </div>
            )}

            {formTipo === "Mantenedor" && (
              <div>
                <Label htmlFor="contrapartidas">Contrapartidas</Label>
                <Textarea
                  id="contrapartidas"
                  value={formContrapartidas}
                  onChange={(e) => setFormContrapartidas(e.target.value)}
                  placeholder="Ex: Logo em eventos, menção em materiais..."
                  rows={3}
                />
              </div>
            )}

            {formTipo === "Fornecedor" && (
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formNome || !formStatus}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O relacionamento será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
