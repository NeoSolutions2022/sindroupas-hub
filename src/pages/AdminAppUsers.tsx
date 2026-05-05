import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, RefreshCw, Power } from "lucide-react";
import { hasuraRequest } from "@/lib/api/hasura";
import {
  createAppUserRequest,
  listAppUsersRequest,
  resetAppUserPasswordRequest,
  updateAppUserRequest,
  updateAppUserStatusRequest,
  type AppUserAdminItem,
  type CreateAppUserPayload,
  type UpdateAppUserPayload,
} from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/use-auth-profile";

const PROFILES_QUERY = `
  query AdminAppUserProfiles {
    app_profiles(order_by: { label: asc }) {
      code
      label
    }
  }
`;

type ProfileOption = { code: string; label: string };
type ProfilesResponse = { app_profiles: ProfileOption[] };

const AdminAppUsers = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { isAdmin } = useAuthProfile();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUserAdminItem | null>(null);
  const [resetTarget, setResetTarget] = useState<AppUserAdminItem | null>(null);

  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formProfileCode, setFormProfileCode] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const [resetPassword, setResetPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-app-users"],
    queryFn: () => listAppUsersRequest(token as string),
    enabled: !!token && isAdmin,
  });

  const { data: profileData } = useQuery({
    queryKey: ["admin-app-user-profiles"],
    queryFn: () => hasuraRequest<ProfilesResponse>({ token, query: PROFILES_QUERY }),
    enabled: !!token && isAdmin,
  });

  const profiles = useMemo(
    () => (profileData?.app_profiles ?? []).filter((item) => item.code.toLowerCase() !== "admin"),
    [profileData],
  );

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["admin-app-users"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAppUserPayload) => createAppUserRequest(token as string, payload),
    onSuccess: invalidateUsers,
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; payload: UpdateAppUserPayload }) =>
      updateAppUserRequest(token as string, params.id, params.payload),
    onSuccess: invalidateUsers,
  });

  const statusMutation = useMutation({
    mutationFn: (params: { id: string; is_active: boolean }) =>
      updateAppUserStatusRequest(token as string, params.id, params.is_active),
    onSuccess: invalidateUsers,
  });

  const resetMutation = useMutation({
    mutationFn: (params: { id: string; password: string }) =>
      resetAppUserPasswordRequest(token as string, params.id, params.password),
  });

  const openCreate = () => {
    setEditing(null);
    setFormEmail("");
    setFormName("");
    setFormProfileCode(profiles[0]?.code ?? "");
    setFormPassword("");
    setModalOpen(true);
  };

  const openEdit = (item: AppUserAdminItem) => {
    setEditing(item);
    setFormEmail(item.email);
    setFormName(item.name);
    setFormProfileCode(item.profile_code);
    setFormPassword("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formEmail || !formName || !formProfileCode) {
      toast.error("Preencha email, nome e perfil.");
      return;
    }

    if (formProfileCode.toLowerCase() === "admin") {
      toast.error("Não é permitido cadastrar profile_code = admin.");
      return;
    }

    if (editing) {
      const payload: UpdateAppUserPayload = {
        email: formEmail,
        name: formName,
        profile_code: formProfileCode,
      };
      await updateMutation.mutateAsync({ id: editing.id, payload });
      toast.success("Usuário atualizado.");
    } else {
      if (!formPassword) {
        toast.error("Informe a senha inicial.");
        return;
      }
      const payload: CreateAppUserPayload = {
        email: formEmail,
        name: formName,
        profile_code: formProfileCode,
        password: formPassword,
      };
      await createMutation.mutateAsync(payload);
      toast.success("Usuário criado.");
    }

    setModalOpen(false);
  };

  const toggleStatus = async (item: AppUserAdminItem) => {
    await statusMutation.mutateAsync({ id: item.id, is_active: !item.is_active });
    toast.success(item.is_active ? "Usuário desativado." : "Usuário ativado.");
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword) {
      toast.error("Informe a nova senha.");
      return;
    }

    await resetMutation.mutateAsync({ id: resetTarget.id, password: resetPassword });
    toast.success("Senha resetada com sucesso.");
    setResetTarget(null);
    setResetPassword("");
  };

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardNavbar />
            <main className="flex-1 overflow-auto p-6 text-muted-foreground">Acesso restrito para administradores.</main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto w-full">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">Usuários operacionais</h1>
                  <p className="text-sm text-muted-foreground">Gestão de app_users via serviço de autenticação.</p>
                </div>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Novo usuário
                </Button>
              </header>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
                      ) : users.length === 0 ? (
                        <TableRow><TableCell colSpan={6}>Nenhum usuário operacional encontrado.</TableCell></TableRow>
                      ) : (
                        users.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>
                              <div className="text-sm">{item.profile_label}</div>
                              <div className="text-xs text-muted-foreground">{item.profile_code}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_active ? "default" : "secondary"}>
                                {item.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(item.created_at).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(item)}>
                                  <Power className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setResetTarget(item)}>
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Criar usuário"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do usuário operacional." : "Cadastre um novo usuário operacional."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={formProfileCode} onValueChange={setFormProfileCode}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.code} value={profile.code}>{profile.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Senha inicial</Label>
                <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>Defina a nova senha para {resetTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Nova senha</Label>
            <Input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="password" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetMutation.isPending}>Resetar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminAppUsers;
