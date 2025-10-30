import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MessageCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mockAssociados = [
  { id: 1, empresa: "Confecções Aurora", cnpj: "12.345.678/0001-90", responsavel: "Maria Silva", status: "Ativo" },
  { id: 2, empresa: "ModaSul Ltda", cnpj: "23.456.789/0001-80", responsavel: "João Santos", status: "Inadimplente" },
  { id: 3, empresa: "Têxtil Nordeste", cnpj: "34.567.890/0001-70", responsavel: "Ana Costa", status: "Ativo" },
  { id: 4, empresa: "Fashion Plus", cnpj: "45.678.901/0001-60", responsavel: "Pedro Oliveira", status: "Não atualizado" },
];

const Cadastros = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredAssociados = mockAssociados.filter((associado) => {
    const matchesSearch =
      associado.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      associado.cnpj.includes(searchTerm);
    const matchesStatus = statusFilter === "Todos" || associado.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendWhatsApp = (empresa: string) => {
    const formUrl = "https://forms.google.com/example";
    const message = `Olá! Por favor, atualize os dados da ${empresa}: ${formUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    toast({
      title: "Mensagem enviada",
      description: `Link de atualização enviado para ${empresa}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      Ativo: "default",
      Inadimplente: "destructive",
      "Não atualizado": "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Cadastros de Associados</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filtros e Busca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por empresa ou CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativos</SelectItem>
                      <SelectItem value="Inadimplente">Inadimplentes</SelectItem>
                      <SelectItem value="Não atualizado">Não atualizados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Associados ({filteredAssociados.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssociados.map((associado) => (
                      <TableRow key={associado.id}>
                        <TableCell className="font-medium">{associado.empresa}</TableCell>
                        <TableCell>{associado.cnpj}</TableCell>
                        <TableCell>{associado.responsavel}</TableCell>
                        <TableCell>{getStatusBadge(associado.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/cadastros/${associado.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSendWhatsApp(associado.empresa)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Atualizar Dados
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Cadastros;
