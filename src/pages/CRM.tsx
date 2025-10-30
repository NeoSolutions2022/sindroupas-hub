import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cake, Eye, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockEmpresas = [
  { 
    id: 1, 
    nome: "Estilo Nordeste", 
    engajamento: 82, 
    beneficios: ["Parceria Unifor", "Convênio Sebrae"],
    aniversario: "15/04"
  },
  { 
    id: 2, 
    nome: "Costura Viva", 
    engajamento: 67, 
    beneficios: ["Curso de Moda Sustentável"],
    aniversario: null
  },
  { 
    id: 3, 
    nome: "Confecções Aurora", 
    engajamento: 91, 
    beneficios: ["Parceria Unifor", "Convênio Sebrae", "Desconto em Insumos"],
    aniversario: "22/04"
  },
  { 
    id: 4, 
    nome: "ModaSul Ltda", 
    engajamento: 45, 
    beneficios: ["Curso de Moda Sustentável"],
    aniversario: null
  },
];

const aniversariantes = mockEmpresas.filter(e => e.aniversario);

const CRM = () => {
  const navigate = useNavigate();

  const getEngajamentoColor = (valor: number) => {
    if (valor >= 80) return "text-accent";
    if (valor >= 50) return "text-primary";
    return "text-destructive";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">CRM - Relacionamento</h1>
            </div>

            {aniversariantes.length > 0 && (
              <Alert className="bg-secondary/30 border-accent">
                <Cake className="h-4 w-4" />
                <AlertDescription>
                  <strong>Aniversariantes do mês:</strong>{" "}
                  {aniversariantes.map((a) => `${a.nome} (${a.aniversario})`).join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              {mockEmpresas.map((empresa) => (
                <Card key={empresa.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl">{empresa.nome}</CardTitle>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Engajamento</span>
                            <span className={`font-bold ${getEngajamentoColor(empresa.engajamento)}`}>
                              {empresa.engajamento}%
                            </span>
                          </div>
                          <Progress value={empresa.engajamento} className="h-2" />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/crm/${empresa.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Benefícios Ativos</p>
                        <div className="flex flex-wrap gap-2">
                          {empresa.beneficios.map((beneficio, idx) => (
                            <Badge key={idx} variant="secondary">
                              {beneficio}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {empresa.aniversario && (
                        <div className="flex items-center gap-2 text-sm">
                          <Cake className="h-4 w-4 text-accent" />
                          <span>Aniversário: {empresa.aniversario}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CRM;
