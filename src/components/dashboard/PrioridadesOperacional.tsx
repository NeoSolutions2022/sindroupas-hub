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
  critico: "bg-destructive/10 text-destructive border-destructive/20",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  aniversario: "bg-accent/10 text-accent border-accent/20",
  neutro: "bg-secondary text-secondary-foreground border-border",
};

export const PrioridadesOperacional = ({
  prioridades,
  onVerDetalhes,
  onAcaoPrimaria,
}: PrioridadesOperacionalProps) => {
  if (prioridades.length === 0) {
    return (
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base font-semibold">Prioridades de Hoje</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-secondary p-4 mb-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">
            Nenhuma prioridade crítica hoje
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
            Todas as empresas estão em dia. Continue o bom trabalho!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base font-semibold">Prioridades de Hoje</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            Top {Math.min(prioridades.length, 5)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {prioridades.slice(0, 5).map((prioridade, index) => {
          const isCritico = prioridade.chips.some((c) => c.tipo === "critico");
          const isAniversario = prioridade.tipo === "aniversario";
          
          return (
            <div
              key={prioridade.id}
              className={`
                relative rounded-lg border bg-background p-3 transition-card hover:shadow-card
                ${isCritico 
                  ? "border-l-[3px] border-l-destructive border-t-border border-r-border border-b-border" 
                  : isAniversario 
                    ? "border-l-[3px] border-l-accent border-t-border border-r-border border-b-border"
                    : "border-border"
                }
              `}
            >
              {/* Top row: Number + Avatar + Info */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarImage src={prioridade.logo} alt={prioridade.nome} />
                  <AvatarFallback className="bg-secondary text-foreground text-[10px] font-medium">
                    {prioridade.nome
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm leading-tight truncate">
                    {prioridade.nome}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {prioridade.contexto}
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 ml-9">
                {prioridade.chips.map((chip, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0.5 font-medium ${CHIP_STYLES[chip.tipo]}`}
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-3 ml-0 sm:ml-9">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 flex-1 sm:flex-none min-w-0"
                  onClick={() => onAcaoPrimaria(prioridade)}
                >
                  {prioridade.tipo === "boleto" ? (
                    <>
                      <Receipt className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Cobrar</span>
                    </>
                  ) : (
                    <>
                      <Gift className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Enviar</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onVerDetalhes(prioridade.id)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Detalhes</span>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
