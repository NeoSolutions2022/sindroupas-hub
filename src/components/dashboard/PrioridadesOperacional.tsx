import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Receipt, Gift, Eye, AlertCircle, Sparkles } from "lucide-react";

export interface PrioridadeOperacional {
  id: number;
  nome: string;
  logo?: string;
  tipo: "boleto" | "aniversario";
  contexto: string;
  chips: Array<{
    label: string;
    tipo: "critico" | "atencao" | "aniversario" | "neutro";
  }>;
}

interface PrioridadesOperacionalProps {
  prioridades: PrioridadeOperacional[];
  onVerDetalhes: (id: number) => void;
  onAcaoPrimaria: (prioridade: PrioridadeOperacional) => void;
}

const CHIP_STYLES = {
  critico: "bg-destructive text-destructive-foreground",
  atencao: "bg-amber-500 text-white",
  aniversario: "bg-accent text-accent-foreground",
  neutro: "bg-secondary text-secondary-foreground",
};

export const PrioridadesOperacional = ({
  prioridades,
  onVerDetalhes,
  onAcaoPrimaria,
}: PrioridadesOperacionalProps) => {
  if (prioridades.length === 0) {
    return (
      <Card className="border-border bg-card h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg font-semibold">Prioridades de Hoje</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-secondary p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">
            Nenhuma prioridade crítica hoje
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Todas as empresas estão em dia. Continue o bom trabalho!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg font-semibold">Prioridades de Hoje</CardTitle>
          <Badge variant="outline" className="text-muted-foreground">
            Top {prioridades.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {prioridades.slice(0, 5).map((prioridade, index) => (
            <div
              key={prioridade.id}
              className={`flex flex-col gap-3 p-3 rounded-lg border border-border bg-background ${
                prioridade.chips.some((c) => c.tipo === "critico")
                  ? "border-l-4 border-l-destructive"
                  : prioridade.tipo === "aniversario"
                  ? "border-l-4 border-l-accent"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold text-muted-foreground shrink-0">
                  {index + 1}
                </div>
                <Avatar className="h-9 w-9 border border-border shrink-0">
                  <AvatarImage src={prioridade.logo} alt={prioridade.nome} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                    {prioridade.nome
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-sm">
                    {prioridade.nome}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {prioridade.contexto}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pl-9">
                {prioridade.chips.map((chip, i) => (
                  <Badge
                    key={i}
                    className={`text-xs ${CHIP_STYLES[chip.tipo]}`}
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 pl-9">
                <Button
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => onAcaoPrimaria(prioridade)}
                >
                  {prioridade.tipo === "boleto" ? (
                    <>
                      <Receipt className="h-3.5 w-3.5" />
                      Cobrar boleto
                    </>
                  ) : (
                    <>
                      <Gift className="h-3.5 w-3.5" />
                      Enviar mensagem
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onVerDetalhes(prioridade.id)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
