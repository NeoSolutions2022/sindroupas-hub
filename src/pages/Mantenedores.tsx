import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockMantenedores = [
  {
    id: 1,
    empresa: "Têxtil Nordeste S/A",
    cnpj: "11.222.333/0001-44",
    contato: "Carlos Mendes",
    aporteTotal: 50000,
    status: "Ativo",
    contrapartidas: "Logo em eventos, menção em materiais de divulgação",
  },
  {
    id: 2,
    empresa: "Indústria Fashion Brasil",
    cnpj: "44.555.666/0001-33",
    contato: "Mariana Silva",
    aporteTotal: 35000,
    status: "Ativo",
    contrapartidas: "Espaço para estande em eventos, consultoria exclusiva",
  },
  {
    id: 3,
    empresa: "Confecções Premium",
    cnpj: "77.888.999/0001-22",
    contato: "Roberto Costa",
    aporteTotal: 25000,
    status: "Encerrado",
    contrapartidas: "Logo em eventos",
  },
];

const Mantenedores = () => {
  const { toast } = useToast();

  const handleNovoCadastro = () => {
    toast({
      title: "Cadastro realizado",
      description: "Novo mantenedor cadastrado com sucesso.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Mantenedores</h1>
                <p className="text-muted-foreground">Gestão de empresas patrocinadoras</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Mantenedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Mantenedor</DialogTitle>
                    <DialogDescription>
                      Registre uma empresa patrocinadora do sindicato
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="empresaMantenedor">Nome da Empresa</Label>
                        <Input id="empresaMantenedor" placeholder="Razão social" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpjMantenedor">CNPJ</Label>
                        <Input id="cnpjMantenedor" placeholder="00.000.000/0000-00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contatoMantenedor">Contato Responsável</Label>
                        <Input id="contatoMantenedor" placeholder="Nome do responsável" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aporteInicial">Aporte Inicial (R$)</Label>
                        <Input id="aporteInicial" type="number" placeholder="0,00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contrapartidas">Contrapartidas Acordadas</Label>
                      <Textarea
                        id="contrapartidas"
                        placeholder="Descreva as contrapartidas oferecidas ao mantenedor..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleNovoCadastro} className="w-full">Cadastrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Aportado</CardDescription>
                  <CardTitle className="text-3xl">R$ 110.000</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    <span>3 mantenedores ativos</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Média de Aporte</CardDescription>
                  <CardTitle className="text-3xl">R$ 36.667</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Por mantenedor</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Status Geral</CardDescription>
                  <CardTitle className="text-3xl">2 Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">1 encerrado</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas Patrocinadoras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockMantenedores.map((mantenedor) => (
                    <div key={mantenedor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{mantenedor.empresa}</h3>
                          <p className="text-sm text-muted-foreground">{mantenedor.cnpj}</p>
                        </div>
                        <Badge
                          className={
                            mantenedor.status === "Ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {mantenedor.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Contato:</span>
                          <p className="font-medium">{mantenedor.contato}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Aporte Total:</span>
                          <p className="font-medium text-primary">
                            R$ {mantenedor.aporteTotal.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contrapartidas:</span>
                          <p className="font-medium">{mantenedor.contrapartidas}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Histórico de Aportes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Out/2025</TableCell>
                        <TableCell>Têxtil Nordeste S/A</TableCell>
                        <TableCell>R$ 10.000</TableCell>
                        <TableCell><Badge variant="outline">Trimestral</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Set/2025</TableCell>
                        <TableCell>Indústria Fashion Brasil</TableCell>
                        <TableCell>R$ 8.500</TableCell>
                        <TableCell><Badge variant="outline">Mensal</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Mantenedores;
