import { useState } from "react";
import { ChevronDown, Mail, MessageCircle, Plus, Pencil, Search, Trash2, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  contatos?: { nome?: string; email?: string; whatsapp?: string };
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
    contatos: {
      nome: "Ana Paula",
      email: "ana.paula@sebrae.com",
      whatsapp: "5585988887777",
    },
    descricao: "Parceria para desenvolvimento empresarial",
  },
  {
    id: "p2",
    tipo: "Parceiro",
    nome: "FIRJAN",
    categoria: "Associação",
    status: "Ativo",
    ultimaMov: "2025-09-15 • Workshop conjunto",
    contatos: { nome: "Contato Institucional", email: "firjan@firjan.org.br" },
  },
  {
    id: "m1",
    tipo: "Mantenedor",
    nome: "Têxtil Nordeste S/A",
    cnpj: "11.222.333/0001-44",
    status: "Ativo",
    ultimaMov: "Aporte R$ 50.000 em 2025-09-12",
    contatos: {
      nome: "Carlos Monteiro",
      email: "contato@textilnordeste.com.br",
      whatsapp: "5585999998888",
    },
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
    contatos: {
      nome: "Marina Costa",
      email: "comercial@graficaverde.com",
      whatsapp: "5585987654321",
    },
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
    contatos: { nome: "Contato Comercial", email: "eventos@techaudio.com.br" },
    ultimoPagamento: { data: "2025-10-15", valor: 5800 },
  },
];

const categoriasParceiro = ["Universidade", "IEL", "FIRJAN", "SEBRAE", "Associação", "Fomento"];
const categoriasFornecedor = ["Estrutura", "Papelaria", "Brindes", "Audiovisual"];

export default function Relacionamentos() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [relacionamentos, setRelacionamentos] = useState<Relacionamento[]>(mockRelacionamentos);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoRelacionamento[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const tipoOptions: TipoRelacionamento[] = ["Parceiro", "Mantenedor", "Fornecedor"];

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

  const clearFilters = () => {
    setSearchTerm("");
    setTipoFilter([]);
    setCategoriaFilter("");
    setStatusFilter("");
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

  const formatWhatsappLink = (whatsapp?: string) => {
    if (!whatsapp) return null;
    const digits = whatsapp.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-4 md:p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Relacionamentos</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar
                </Button>
              </div>

              {/* Search & Filters */}
              <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#1C1C1C]">Filtros</span>
                    <span className="text-xs text-muted-foreground">Aplique combinações de filtros para encontrar relacionamentos com rapidez.</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="self-start p-0 text-sm font-semibold text-[#1C1C1C] hover:bg-transparent hover:underline"
                    onClick={clearFilters}
                    aria-label="Limpar filtros"
                  >
                    Limpar filtros
                  </Button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CNPJ ou palavra-chave…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 rounded-full border-[#CBD5B1] bg-white pl-10 text-sm"
                    />
                  </div>

                  <div className="grid w-full gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-11 justify-between rounded-full border-[#CBD5B1] bg-white text-sm text-[#1C1C1C]"
                        >
                          <span>
                            Tipo{tipoFilter.length ? ` • ${tipoFilter.join(", ")}` : ""}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 space-y-3" align="start">
                        <p className="text-sm font-semibold text-[#1C1C1C]">Selecione o tipo</p>
                        <div className="flex flex-col gap-2">
                          {tipoOptions.map((tipo) => (
                            <label key={tipo} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                id={`tipo-${tipo}`}
                                checked={tipoFilter.includes(tipo)}
                                onCheckedChange={() => handleTipoFilterToggle(tipo)}
                              />
                              <span>{tipo}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                      <SelectTrigger className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm">
                        <SelectValue placeholder="Categoria" />
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm">
                        <SelectValue placeholder="Status" />
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

              {/* Mobile Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {filteredRelacionamentos.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      Nenhum relacionamento encontrado
                    </Card>
                  ) : (
                    filteredRelacionamentos.map((r) => (
                      <Card key={r.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getTipoBadgeVariant(r.tipo)} className="text-xs">{r.tipo}</Badge>
                              <Badge variant={getStatusBadgeVariant(r.status)} className="text-xs">{r.status}</Badge>
                            </div>
                            <h3 className="font-semibold text-foreground mt-2 truncate">{r.nome}</h3>
                            {r.cnpj && <p className="text-xs text-muted-foreground">{r.cnpj}</p>}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {r.categoria && (
                            <div>
                              <span className="text-muted-foreground">Categoria:</span>
                              <p className="font-medium">{r.categoria}</p>
                            </div>
                          )}
                          {r.ultimaMov && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Última mov.:</span>
                              <p className="font-medium truncate">{r.ultimaMov}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact info */}
                        {r.contatos && (r.contatos.nome || r.contatos.whatsapp || r.contatos.email) && (
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{r.contatos.nome || "Contato principal"}</p>
                              {r.contatos.whatsapp && <p className="text-muted-foreground">{r.contatos.whatsapp}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              {formatWhatsappLink(r.contatos?.whatsapp) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={formatWhatsappLink(r.contatos?.whatsapp)!} target="_blank" rel="noreferrer">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                  </a>
                                </Button>
                              )}
                              {r.contatos?.email && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={`mailto:${r.contatos.email}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-destructive"
                            onClick={() => openDeleteDialog(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                /* Desktop Table View */
                <Card>
                  <TooltipProvider>
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
                          <TableHead>Comunicação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRelacionamentos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {r.contatos?.nome || "Contato principal"}
                                    </div>
                                    {(r.contatos?.whatsapp || r.contatos?.email) && (
                                      <div className="text-xs text-muted-foreground">
                                        {[r.contatos?.whatsapp, r.contatos?.email]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {formatWhatsappLink(r.contatos?.whatsapp) ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            aria-label={`Abrir conversa no WhatsApp com ${r.contatos?.nome || r.nome}`}
                                          >
                                            <a
                                              href={formatWhatsappLink(r.contatos?.whatsapp) || undefined}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              <MessageCircle className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button variant="ghost" size="icon" disabled>
                                            <MessageCircle className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </TooltipTrigger>
                                      <TooltipContent> Abrir WhatsApp </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {r.contatos?.email ? (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            aria-label={`Enviar e-mail para ${r.contatos?.nome || r.nome}`}
                                          >
                                            <a href={`mailto:${r.contatos.email}`}>
                                              <Mail className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        ) : (
                                          <Button variant="ghost" size="icon" disabled>
                                            <Mail className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </TooltipTrigger>
                                      <TooltipContent> Enviar e-mail </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
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
                  </TooltipProvider>
                </Card>
              )}
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
