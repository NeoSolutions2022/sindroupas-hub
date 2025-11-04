import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const mockFornecedores = [
  { id: 1, empresa: "Gráfica Verde", categoria: "Papelaria", status: "Ativo", ultimoPagamento: "2025-10-02" },
  { id: 2, empresa: "TechSound Audio", categoria: "Audiovisual", status: "Ativo", ultimoPagamento: "2025-09-15" },
  { id: 3, empresa: "Brindes & Cia", categoria: "Brindes", status: "Ativo", ultimoPagamento: "2025-10-20" },
  { id: 4, empresa: "Estrutura Pro", categoria: "Estrutura", status: "Pendente", ultimoPagamento: "2025-08-10" },
];

const Fornecedores = () => {
  const [filterCategoria, setFilterCategoria] = useState("Todos");
  const { toast } = useToast();

  const filteredFornecedores = mockFornecedores.filter(
    (f) => filterCategoria === "Todos" || f.categoria === filterCategoria
  );

  const handleNovaProposta = () => {
    toast({
      title: "Proposta enviada",
      description: "Nova proposta registrada com sucesso.",
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
                <h1 className="text-3xl font-bold text-primary">Fornecedores</h1>
                <p className="text-muted-foreground">Gestão de fornecedores e propostas</p>
              </div>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Proposta
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Nova Proposta de Fornecimento</DrawerTitle>
                    <DrawerDescription>
                      Registre uma nova proposta de fornecedor
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <Input id="fornecedor" placeholder="Nome do fornecedor" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="estrutura">Estrutura</SelectItem>
                          <SelectItem value="papelaria">Papelaria</SelectItem>
                          <SelectItem value="brindes">Brindes</SelectItem>
                          <SelectItem value="audiovisual">Audiovisual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea id="descricao" placeholder="Descreva o serviço ou produto" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$)</Label>
                        <Input id="valor" type="number" placeholder="0,00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prazo">Prazo (dias)</Label>
                        <Input id="prazo" type="number" placeholder="30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Anexo (Proposta)</Label>
                      <Button variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload de arquivo
                      </Button>
                    </div>
                    <Button onClick={handleNovaProposta} className="w-full">Enviar Proposta</Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>Lista de Fornecedores</CardTitle>
                  <div className="flex gap-2">
                    {["Todos", "Estrutura", "Papelaria", "Brindes", "Audiovisual"].map((cat) => (
                      <Button
                        key={cat}
                        variant={filterCategoria === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterCategoria(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFornecedores.map((fornecedor) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell className="font-medium">{fornecedor.empresa}</TableCell>
                          <TableCell>{fornecedor.categoria}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                fornecedor.status === "Ativo"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {fornecedor.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{fornecedor.ultimoPagamento}</TableCell>
                        </TableRow>
                      ))}
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

export default Fornecedores;
