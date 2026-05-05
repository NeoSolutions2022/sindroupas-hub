import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
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
import { hasuraRequest } from "@/lib/api/hasura";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/use-auth-profile";

type ActivityType = "EVENTO" | "PARCERIA" | "NEGOCIO" | "NOVO_ASSOCIADO";

const activityTypeLabels: Record<ActivityType, string> = {
  EVENTO: "Evento realizado",
  PARCERIA: "Parceria firmada",
  NEGOCIO: "Negócio gerado",
  NOVO_ASSOCIADO: "Novo associado",
};

const activityTypes: ActivityType[] = ["EVENTO", "PARCERIA", "NEGOCIO", "NOVO_ASSOCIADO"];

const typeBadgeColor: Record<ActivityType, string> = {
  EVENTO: "bg-blue-100 text-blue-700 border-blue-200",
  PARCERIA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NEGOCIO: "bg-amber-100 text-amber-700 border-amber-200",
  NOVO_ASSOCIADO: "bg-violet-100 text-violet-700 border-violet-200",
};

const ATIVIDADES_QUERY = `
  query AtividadesPage($where: atividades_bool_exp!, $profileWhere: app_profiles_bool_exp!, $usersWhere: app_users_bool_exp!) {
    atividades(where: $where, order_by: [{ year: desc }, { month: desc }, { occurred_on: desc }]) {
      id
      occurred_on
      year
      month
      tipo
      quantity
      observation
      owner_user_id
      owner_user {
        id
        name
        profile_code
        profile {
          code
          label
        }
      }
    }
    app_profiles(where: $profileWhere, order_by: { label: asc }) {
      code
      label
    }
    app_users(where: $usersWhere, order_by: { name: asc }) {
      id
      name
      profile_code
    }
  }
`;

const INSERT_ATIVIDADE = `
  mutation InsertAtividade($object: atividades_insert_input!) {
    insert_atividades_one(object: $object) { id }
  }
`;

const UPDATE_ATIVIDADE = `
  mutation UpdateAtividade($id: uuid!, $set: atividades_set_input!) {
    update_atividades_by_pk(pk_columns: { id: $id }, _set: $set) { id }
  }
`;

const DELETE_ATIVIDADE = `
  mutation DeleteAtividade($id: uuid!) {
    delete_atividades_by_pk(id: $id) { id }
  }
`;

type ActivityRow = {
  id: string;
  occurred_on?: string | null;
  year?: number | null;
  month?: number | null;
  tipo: ActivityType;
  quantity: number;
  observation?: string | null;
  owner_user_id: string;
  owner_user?: {
    id: string;
    name?: string | null;
    profile_code?: string | null;
    profile?: { code?: string | null; label?: string | null } | null;
  } | null;
};

type ProfileOption = { code: string; label: string };
type AppUserRow = { id: string; name?: string | null; profile_code?: string | null };

type AtividadesResponse = {
  atividades: ActivityRow[];
  app_profiles: ProfileOption[];
  app_users: AppUserRow[];
};

const now = new Date();

const Atividades = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { isAdmin, userId, profileCode } = useAuthProfile();

  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<"ALL" | ActivityType>("ALL");
  const [selectedProfile, setSelectedProfile] = useState<string>(profileCode ?? "ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formType, setFormType] = useState<ActivityType>("EVENTO");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formQty, setFormQty] = useState("");
  const [formNote, setFormNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["atividades", { filterMonth, filterYear, filterType, selectedProfile, userId, isAdmin }],
    queryFn: async () => {
      const whereAnd: Record<string, unknown>[] = [
        { year: { _eq: filterYear } },
        { month: { _eq: filterMonth + 1 } },
      ];

      if (filterType !== "ALL") {
        whereAnd.push({ tipo: { _eq: filterType } });
      }

      if (isAdmin) {
        if (selectedProfile !== "ALL") {
          whereAnd.push({ owner_user: { profile_code: { _eq: selectedProfile } } });
        }
      } else if (effectiveUserId) {
        whereAnd.push({ owner_user_id: { _eq: effectiveUserId } });
      } else {
        whereAnd.push({ owner_user_id: { _eq: "__missing_user__" } });
      }

      const response = await hasuraRequest<AtividadesResponse>({
        token,
        query: ATIVIDADES_QUERY,
        variables: {
          where: { _and: whereAnd },
          profileWhere: {},
          usersWhere: isAdmin
            ? {}
            : userId
              ? { id: { _eq: userId } }
              : profileCode
                ? { profile_code: { _eq: profileCode } }
                : { id: { _eq: "__missing_user__" } },
        },
      });

      return response;
    },
    enabled: !!token,
  });

  const activities = data?.atividades ?? [];
  const profiles = data?.app_profiles ?? [];
  const appUsers = data?.app_users ?? [];
  const effectiveUserId = userId ?? appUsers[0]?.id ?? null;

  const appUserByProfile = useMemo(() => {
    const map = new Map<string, AppUserRow>();
    for (const appUser of appUsers) {
      if (appUser.profile_code && !map.has(appUser.profile_code)) {
        map.set(appUser.profile_code, appUser);
      }
    }
    return map;
  }, [appUsers]);

  const canMutate = isAdmin || !!effectiveUserId;

  const insertMutation = useMutation({
    mutationFn: (variables: { object: Record<string, unknown> }) =>
      hasuraRequest({ token, query: INSERT_ATIVIDADE, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["atividades"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; set: Record<string, unknown> }) =>
      hasuraRequest({ token, query: UPDATE_ATIVIDADE, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["atividades"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (variables: { id: string }) => hasuraRequest({ token, query: DELETE_ATIVIDADE, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["atividades"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setFormType("EVENTO");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormQty("");
    setFormNote("");
    setModalOpen(true);
  };

  const openEdit = (a: ActivityRow) => {
    const cannotEdit = !isAdmin && a.owner_user_id !== effectiveUserId;
    if (cannotEdit) {
      toast.error("Você não pode editar atividades de outro perfil.");
      return;
    }

    setEditing(a);
    setFormType(a.tipo);
    setFormDate(a.occurred_on ?? new Date().toISOString().slice(0, 10));
    setFormQty(String(a.quantity));
    setFormNote(a.observation ?? "");
    setModalOpen(true);
  };

  const resolveOwnerUserId = () => {
    if (!isAdmin) return effectiveUserId;

    if (selectedProfile !== "ALL") {
      return appUserByProfile.get(selectedProfile)?.id ?? null;
    }

    return userId;
  };

  const handleSave = async () => {
    const qty = parseInt(formQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!canMutate) {
      toast.error("Sessão sem dados de perfil para registrar atividade.");
      return;
    }

    const ownerUserId = editing?.owner_user_id ?? resolveOwnerUserId();
    if (!ownerUserId) {
      toast.error("Selecione um perfil válido para registrar a atividade.");
      return;
    }

    if (editing) {
      const cannotEdit = !isAdmin && editing.owner_user_id !== effectiveUserId;
      if (cannotEdit) {
        toast.error("Você não pode editar atividades de outro perfil.");
        return;
      }

      await updateMutation.mutateAsync({
        id: editing.id,
        set: { tipo: formType, occurred_on: formDate, quantity: qty, observation: formNote },
      });
      toast.success("Atividade atualizada!");
    } else {
      await insertMutation.mutateAsync({
        object: {
          owner_user_id: ownerUserId,
          tipo: formType,
          occurred_on: formDate,
          quantity: qty,
          observation: formNote,
        },
      });
      toast.success("Atividade registrada!");
    }

    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const target = activities.find((item) => item.id === deleteId);
    if (!target) return;

    const cannotDelete = !isAdmin && target.owner_user_id !== effectiveUserId;
    if (cannotDelete) {
      toast.error("Você não pode excluir atividades de outro perfil.");
      return;
    }

    await deleteMutation.mutateAsync({ id: deleteId });
    toast.success("Atividade excluída!");
    setDeleteId(null);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const getDirectorName = (item: ActivityRow) => {
    return item.owner_user?.name || item.owner_user?.profile?.label || "—";
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto w-full">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">Atividades</h1>
                  <p className="text-sm text-muted-foreground">
                    Registro de eventos, parcerias e negócios dos diretores
                  </p>
                </div>
                <Button onClick={openCreate} className="w-full sm:w-auto" disabled={!canMutate}>
                  <Plus className="h-4 w-4 mr-2" /> Registrar atividade
                </Button>
              </header>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                  {isAdmin ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Visualizar como</Label>
                      <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                        <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos os perfis</SelectItem>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.code} value={profile.code}>{profile.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Visualizar como</Label>
                      <Input value={profileCode ?? "Meu perfil"} readOnly className="h-10 rounded-lg" />
                    </div>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Carregando atividades...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma atividade encontrada para o período selecionado.
                </div>
              ) : isMobile ? (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <Card key={a.id} className="border-border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={typeBadgeColor[a.tipo]}>
                            {activityTypeLabels[a.tipo]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(a.occurred_on)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">{a.quantity}</span>
                          <span className="text-xs text-muted-foreground">{getDirectorName(a)}</span>
                        </div>
                        {a.observation && <p className="text-xs text-muted-foreground">{a.observation}</p>}
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
                        <TableHead>Diretor</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(a.occurred_on)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={typeBadgeColor[a.tipo]}>
                              {activityTypeLabels[a.tipo]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{a.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{getDirectorName(a)}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{a.observation || "—"}</TableCell>
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
            <Button onClick={handleSave} disabled={insertMutation.isPending || updateMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Atividades;
