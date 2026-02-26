import { useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ImpersonationBar } from "@/components/ImpersonationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMockAuth, mockUsers } from "@/contexts/MockAuthContext";
import {
  useActivities,
  activityTypeLabels,
  type Activity,
  type ActivityType,
} from "@/contexts/ActivitiesContext";

const activityTypes: ActivityType[] = ["EVENTO", "PARCERIA", "NEGOCIO", "NOVO_ASSOCIADO"];

const typeBadgeColor: Record<ActivityType, string> = {
  EVENTO: "bg-blue-100 text-blue-700 border-blue-200",
  PARCERIA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NEGOCIO: "bg-amber-100 text-amber-700 border-amber-200",
  NOVO_ASSOCIADO: "bg-violet-100 text-violet-700 border-violet-200",
};

const now = new Date();

const Atividades = () => {
  const isMobile = useIsMobile();
  const { activeUser } = useMockAuth();
  const { activities, addActivity, updateActivity, removeActivity } = useActivities();

  // Filters
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<"ALL" | ActivityType>("ALL");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<ActivityType>("EVENTO");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formQty, setFormQty] = useState("");
  const [formNote, setFormNote] = useState("");

  // Filtered data
  const filtered = useMemo(() => {
    let list = activities;

    // Role filter
    if (activeUser.role === "DIRETOR") {
      list = list.filter((a) => a.userId === activeUser.id);
    }

    // Period
    list = list.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });

    // Type
    if (filterType !== "ALL") {
      list = list.filter((a) => a.type === filterType);
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [activities, activeUser, filterMonth, filterYear, filterType]);

  const openCreate = () => {
    setEditing(null);
    setFormType("EVENTO");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormQty("");
    setFormNote("");
    setModalOpen(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    setFormType(a.type);
    setFormDate(a.date);
    setFormQty(String(a.quantity));
    setFormNote(a.note);
    setModalOpen(true);
  };

  const handleSave = () => {
    const qty = parseInt(formQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }
    if (editing) {
      updateActivity(editing.id, { type: formType, date: formDate, quantity: qty, note: formNote });
      toast.success("Atividade atualizada!");
    } else {
      addActivity({ userId: activeUser.id, type: formType, date: formDate, quantity: qty, note: formNote });
      toast.success("Atividade registrada!");
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      removeActivity(deleteId);
      toast.success("Atividade excluída!");
      setDeleteId(null);
    }
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const getUserName = (uid: string) => mockUsers.find((u) => u.id === uid)?.name ?? uid;

  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <ImpersonationBar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto w-full">
              {/* Header */}
              <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">Atividades</h1>
                  <p className="text-sm text-muted-foreground">
                    Registro de eventos, parcerias e negócios dos diretores
                  </p>
                </div>
                <Button onClick={openCreate} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Registrar atividade
                </Button>
              </header>

              {/* Filters */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Mês</Label>
                    <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Ano</Label>
                    <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(now.getFullYear() - 1)}>{now.getFullYear() - 1}</SelectItem>
                        <SelectItem value={String(now.getFullYear())}>{now.getFullYear()}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as "ALL" | ActivityType)}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {activityTypes.map((t) => (
                          <SelectItem key={t} value={t}>{activityTypeLabels[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Results */}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma atividade encontrada para o período selecionado.
                </div>
              ) : isMobile ? (
                <div className="space-y-3">
                  {filtered.map((a) => (
                    <Card key={a.id} className="border-border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={typeBadgeColor[a.type]}>
                            {activityTypeLabels[a.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">{a.quantity}</span>
                          {activeUser.role === "ADMIN" && (
                            <span className="text-xs text-muted-foreground">{getUserName(a.userId)}</span>
                          )}
                        </div>
                        {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(a)}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        {activeUser.role === "ADMIN" && <TableHead>Diretor</TableHead>}
                        <TableHead>Observação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(a.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={typeBadgeColor[a.type]}>
                              {activityTypeLabels[a.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{a.quantity}</TableCell>
                          {activeUser.role === "ADMIN" && (
                            <TableCell className="text-muted-foreground">{getUserName(a.userId)}</TableCell>
                          )}
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{a.note || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar atividade" : "Registrar atividade"}</DialogTitle>
            <DialogDescription>
              {editing ? "Altere os campos desejados." : "Preencha os dados da atividade."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as ActivityType)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{activityTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{formType === "EVENTO" ? "Participantes" : "Quantidade"}</Label>
              <Input
                type="number"
                min={1}
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                placeholder="Ex.: 50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value.slice(0, 140))}
                maxLength={140}
                placeholder="Breve descrição..."
                className="resize-none"
                rows={2}
              />
              <p className="text-[10px] text-muted-foreground text-right">{formNote.length}/140</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Atividades;
