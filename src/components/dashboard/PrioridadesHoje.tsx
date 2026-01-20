import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Eye, AlertCircle, Sparkles, Pencil } from "lucide-react";
import { PrioridadeItem } from "./types";
import { getWhatsappLink, getResponsavel } from "./utils";

interface PrioridadesHojeProps {
  prioridades: PrioridadeItem[];
  onVerDetalhes: (empresa: PrioridadeItem) => void;
  onCompletarCadastro?: (empresa: PrioridadeItem) => void;
  emptyState?: boolean;
}

const SeloStatus = ({ selo }: { selo: "Crítico" | "Atenção" | "Oportunidade" }) => {
  const estilos = {
    Crítico: "bg-destructive text-destructive-foreground",
    Atenção: "bg-amber-500 text-white",
    Oportunidade: "bg-accent text-accent-foreground",
  };

  return (
    <Badge className={`${estilos[selo]} text-xs font-medium`}>
      {selo}
    </Badge>
  );
};

export const PrioridadesHoje = ({
  prioridades,
  onVerDetalhes,
  onCompletarCadastro,
  emptyState = false,
}: PrioridadesHojeProps) => {
  if (emptyState || prioridades.length === 0) {
    return (
      <section aria-label="Prioridades de Hoje">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Prioridades de Hoje</h2>
        </div>
        <Card className="border-border bg-card">
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
      </section>
    );
  }

  return (
    <section aria-label="Prioridades de Hoje">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Prioridades de Hoje</h2>
          <Badge variant="outline" className="border-border text-muted-foreground">
            Top {prioridades.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {prioridades.map((empresa, index) => {
          const responsavel = getResponsavel(empresa);
          const whatsappLink = getWhatsappLink(empresa.whatsapp);

          return (
            <Card 
              key={empresa.id} 
              className={`border-border bg-card transition-all hover:shadow-md ${
                empresa.selo === "Crítico" ? "border-l-4 border-l-destructive" : 
                empresa.selo === "Atenção" ? "border-l-4 border-l-amber-500" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info da empresa */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-sm font-bold text-muted-foreground shrink-0">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10 border border-border shrink-0">
                      <AvatarImage src={empresa.logo} alt={empresa.nome} />
                      <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
                        {empresa.nome.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {empresa.nome}
                        </h3>
                        <SeloStatus selo={empresa.selo} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {empresa.motivo}
                      </p>
                      {/* Chips de contexto - ordem padronizada */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {empresa.chips.map((chip, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {chip}
                          </span>
                        ))}
                        {empresa.recomendacao && (
                          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                            💡 {empresa.recomendacao}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                    {whatsappLink ? (
                      <Button
                        asChild
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                        size="sm"
                      >
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir WhatsApp de ${empresa.nome}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Abrir WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={() => onCompletarCadastro?.(empresa)}
                      >
                        <Pencil className="h-4 w-4" />
                        Adicionar WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVerDetalhes(empresa)}
                      className="text-muted-foreground hover:text-foreground gap-1"
                      aria-label={`Ver detalhes de ${empresa.nome}`}
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
